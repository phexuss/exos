import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'paths.dart';
import 'proc.dart';

/// SoundCloud without yt-dlp: resolve the page URL with the web client's id,
/// pick one transcoding and fetch its signed URL. Two requests instead of a
/// Python runtime asking for every transcoding in turn. mpv plays both
/// progressive and HLS streams, so playback needs nothing more; downloads
/// fetch HLS pieces in parallel and join them.
class SoundCloud {
  static const _api = 'https://api-v2.soundcloud.com';
  static const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
  static const _parallel = 8;

  final _http = HttpClient()
    ..userAgent = ua
    ..connectionTimeout = const Duration(seconds: 10);

  String? _clientId;
  Future<String>? _scraping;

  String get _idFile => Paths.join([Paths.dataDir, 'soundcloud-client-id']);

  Future<String> _get(String url) async {
    final req = await _http.getUrl(Uri.parse(url));
    final res = await req.close().timeout(const Duration(seconds: 30));
    final body = await res.transform(utf8.decoder).join();
    if (res.statusCode >= 400) throw _HttpStatus(res.statusCode);
    return body;
  }

  static String? findClientId(String js) {
    final m = RegExp(r'client_id\s*[:=]\s*"([A-Za-z0-9]{32})"').firstMatch(js);
    return m?[1];
  }

  /// The public web client's id, scraped from soundcloud.com's JS bundles.
  Future<String> _scrape() async {
    final html = await _get('https://soundcloud.com/').catchError((Object e) => throw ToolError('soundcloud.com не открылся: $e'));
    final scripts = [for (final m in RegExp(r'<script[^>]+src="(https://[^"]+\.js)"').allMatches(html)) m[1]!];
    // The id lives in one of the last bundles.
    for (final src in scripts.reversed) {
      try {
        final id = findClientId(await _get(src));
        if (id != null) return id;
      } catch (_) {}
    }
    throw ToolError('не нашёл client_id SoundCloud');
  }

  Future<String> _id({bool refresh = false}) async {
    if (!refresh) {
      if (_clientId != null) return _clientId!;
      try {
        final saved = File(_idFile).readAsStringSync().trim();
        if (saved.length == 32) return _clientId = saved;
      } catch (_) {}
    }
    final id = await (_scraping ??= _scrape().whenComplete(() => _scraping = null));
    try {
      Directory(Paths.dataDir).createSync(recursive: true);
      File(_idFile).writeAsStringSync(id);
    } catch (_) {}
    return _clientId = id;
  }

  /// GET with the client id, re-scraping it once if SoundCloud rotated it.
  Future<Map<String, Object?>> _apiGet(String url) async {
    for (var attempt = 0; attempt < 2; attempt++) {
      final id = await _id(refresh: attempt == 1);
      final sep = url.contains('?') ? '&' : '?';
      try {
        return (jsonDecode(await _get('$url${sep}client_id=$id')) as Map).cast<String, Object?>();
      } on _HttpStatus catch (e) {
        if ((e.code == 401 || e.code == 403) && attempt == 0) continue;
        if (e.code == 404) throw ToolError('трек не найден на SoundCloud');
        throw ToolError('SoundCloud ответил ${e.code}');
      } on FormatException {
        throw ToolError('странный ответ SoundCloud');
      } on SocketException catch (e) {
        throw ToolError('SoundCloud не ответил: ${e.message}');
      }
    }
    throw ToolError('SoundCloud не принял client_id');
  }

  /// Progressive first (seeks at once), AAC before MP3 before Opus, full
  /// tracks before previews. Encrypted streams are skipped: they need DRM.
  static int? rank(Map<String, Object?> t) {
    final format = (t['format'] as Map?)?.cast<String, Object?>() ?? const {};
    final protocol = format['protocol'] as String? ?? '';
    final preset = t['preset'] as String? ?? '';
    final url = t['url'] as String? ?? '';
    if (protocol.contains('encrypted') || protocol.startsWith('ctr-') || protocol.startsWith('cbc-')) return null;
    if (preset.startsWith('abr')) return null;
    final progressive = protocol == 'progressive' && !url.contains('/hls');
    if (!progressive && protocol != 'hls') return null;
    final mime = (format['mime_type'] as String? ?? '').toLowerCase();
    final codec = mime.contains('mp4a') || mime.contains('audio/mp4') || preset.startsWith('aac')
        ? 2
        : mime.contains('mpeg') || preset.startsWith('mp3')
        ? 1
        : mime.contains('opus') || preset.startsWith('opus')
        ? 0
        : null;
    if (codec == null) return null;
    return (t['snipped'] == true ? 0 : 16) + (progressive ? 4 : 0) + codec;
  }

  static String extFor(Map<String, Object?> t) {
    final mime = (((t['format'] as Map?)?['mime_type']) as String? ?? '').toLowerCase();
    final preset = t['preset'] as String? ?? '';
    if (mime.contains('mp4a') || mime.contains('audio/mp4') || preset.startsWith('aac')) return 'm4a';
    if (mime.contains('mpeg') || preset.startsWith('mp3')) return 'mp3';
    return 'opus';
  }

  Future<ScStream> resolve(String pageUrl) async {
    final info = await _apiGet('$_api/resolve?url=${Uri.encodeComponent(pageUrl)}');
    final transcodings = [
      for (final t in ((info['media'] as Map?)?['transcodings'] as List? ?? const [])) (t as Map).cast<String, Object?>(),
    ];
    Map<String, Object?>? best;
    var bestRank = -1;
    for (final t in transcodings) {
      final r = rank(t);
      if (r != null && r > bestRank) (best, bestRank) = (t, r);
    }
    if (best == null) throw ToolError('у трека нет подходящего потока');
    var url = best['url'] as String;
    final auth = info['track_authorization'] as String?;
    if (auth != null) url += '${url.contains('?') ? '&' : '?'}track_authorization=${Uri.encodeComponent(auth)}';
    final stream = await _apiGet(url);
    final protocol = ((best['format'] as Map?)?['protocol'] as String?) ?? '';
    return ScStream(stream['url'] as String, hls: protocol == 'hls', ext: extFor(best));
  }

  /* ---------- downloads ---------- */

  static String _join(String base, String uri) {
    if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
    return Uri.parse(base).resolve(uri).toString();
  }

  /// Media playlist → init segment (fMP4) and pieces. Refuses what doesn't
  /// concatenate into one playable file.
  static ({String? init, List<String> segments}) parsePlaylist(String base, String text) {
    if (!text.trimLeft().startsWith('#EXTM3U')) throw ToolError('это не плейлист HLS');
    String? init;
    final segments = <String>[];
    for (final line in text.split('\n').map((l) => l.trim())) {
      if (line.startsWith('#EXT-X-KEY') && !line.contains('METHOD=NONE')) throw ToolError('поток зашифрован');
      if (line.startsWith('#EXT-X-BYTERANGE') || line.startsWith('#EXT-X-STREAM-INF')) throw ToolError('такой HLS не склеить');
      if (line.startsWith('#EXT-X-MAP:')) {
        if (line.contains('BYTERANGE')) throw ToolError('такой HLS не склеить');
        final uri = RegExp(r'URI="([^"]+)"').firstMatch(line)?[1] ?? (throw ToolError('битый EXT-X-MAP'));
        init = _join(base, uri);
      } else if (line.isNotEmpty && !line.startsWith('#')) {
        segments.add(_join(base, line));
      }
    }
    if (segments.isEmpty) throw ToolError('пустой плейлист');
    return (init: init, segments: segments);
  }

  Future<List<int>> _bytes(String url) async {
    final req = await _http.getUrl(Uri.parse(url));
    final res = await req.close().timeout(const Duration(seconds: 60));
    if (res.statusCode >= 400) throw ToolError('кусок потока не скачался: ${res.statusCode}');
    final b = BytesBuilder(copy: false);
    await for (final c in res) {
      b.add(c);
    }
    return b.takeBytes();
  }

  /// Fetches every piece, a few at a time, and writes them in order.
  Future<void> fetchHls(ScStream s, String dest, void Function(double) onProgress, bool Function() cancelled) async {
    final text = await _get(s.url);
    final pl = parsePlaylist(s.url, text);
    if (s.ext != 'mp3' && pl.init == null) throw ToolError('HLS без init-сегмента');
    final urls = [?pl.init, ...pl.segments];
    final sink = File('$dest.part').openWrite();
    try {
      final pending = <Future<List<int>>>[];
      var next = 0, done = 0;
      while (done < urls.length) {
        if (cancelled()) throw ToolError('отменено');
        while (pending.length < _parallel && next < urls.length) {
          pending.add(_bytes(urls[next++]));
        }
        sink.add(await pending.removeAt(0));
        done++;
        onProgress(done / urls.length);
      }
      await sink.close();
      await File('$dest.part').rename(dest);
    } catch (_) {
      await sink.close().catchError((_) {});
      try {
        File('$dest.part').deleteSync();
      } catch (_) {}
      rethrow;
    }
  }

  Future<void> fetchProgressive(String url, String dest, void Function(double) onProgress, bool Function() cancelled) async {
    final req = await _http.getUrl(Uri.parse(url));
    final res = await req.close();
    if (res.statusCode >= 400) throw ToolError('поток не скачался: ${res.statusCode}');
    final total = res.contentLength;
    final sink = File('$dest.part').openWrite();
    var done = 0;
    try {
      await for (final c in res) {
        if (cancelled()) throw ToolError('отменено');
        sink.add(c);
        done += c.length;
        if (total > 0) onProgress(done / total);
      }
      await sink.close();
      await File('$dest.part').rename(dest);
    } catch (_) {
      await sink.close().catchError((_) {});
      try {
        File('$dest.part').deleteSync();
      } catch (_) {}
      rethrow;
    }
  }
}

class ScStream {
  const ScStream(this.url, {required this.hls, required this.ext});
  final String url;
  final bool hls;
  final String ext;
}

class _HttpStatus implements Exception {
  _HttpStatus(this.code);
  final int code;
}
