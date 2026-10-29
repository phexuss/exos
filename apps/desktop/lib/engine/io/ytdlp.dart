import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';

import '../types.dart';
import 'cookies.dart';
import 'paths.dart';
import 'proc.dart';
import 'soundcloud.dart';
import 'tools.dart';

/// Resolving and downloading with yt-dlp on this computer, so YouTube and
/// SoundCloud see the user's own IP. Source and format choice mirror
/// apps/api/src/download/download.service.ts, so a track resolves to the same
/// upload on the phone and on the desktop.
class YtDlp {
  YtDlp(this._sc, this._cookies);
  final SoundCloud _sc;
  final Cookies _cookies;
  final _jobs = <String, void Function()>{};

  /// YouTube's JS challenge alone can take 10-20 s; give the whole run room.
  static const _resolveTimeout = Duration(seconds: 90);
  static const _progressMark = 'EXOSPROG';
  static const _fileMark = 'EXOSFILE';

  static String _host(String url) => Uri.tryParse(url)?.host.toLowerCase() ?? '';
  static bool isSoundCloud(String url) => _host(url) == 'soundcloud.com' || _host(url).endsWith('.soundcloud.com');
  static bool isYoutube(String url) {
    final h = _host(url);
    return h == 'youtube.com' || h.endsWith('.youtube.com') || h == 'youtu.be';
  }

  static bool _isHttp(String s) => s.startsWith('http://') || s.startsWith('https://');

  static String resolveSource(SourceRequest req) {
    final q = req.query.trim();
    if (_isHttp(q)) {
      if (isSoundCloud(q) || isYoutube(q)) return q;
      throw ToolError('поддерживаются только ссылки SoundCloud и YouTube');
    }
    final isrc = req.isrc?.trim();
    if (isrc != null && isrc.length == 12) return 'ytsearch1:$isrc';
    if (q.isEmpty) throw ToolError('пустой запрос');
    return 'ytsearch1:$q';
  }

  /// No user config, our JS runtime, our ffmpeg, a private copy of cookies.
  Future<({List<String> args, String? cookies})> _baseArgs(SourceRequest req, String source, String? ffmpeg) async {
    final args = [
      '--ignore-config', '--no-playlist', '--no-warnings',
      '--extractor-retries', '2', '--socket-timeout', '20',
      // HLS and DASH arrive in small pieces; fetch several at once.
      '--concurrent-fragments', '4',
    ];
    final js = await Tools.jsRuntime();
    if (js != null) args.addAll(['--js-runtimes', '${js.name}:${js.path}']);
    if (ffmpeg != null) args.addAll(['--ffmpeg-location', ffmpeg]);
    String? cookies;
    final browser = req.cookiesBrowser;
    if (browser != null && browser.isNotEmpty && (isYoutube(source) || source.startsWith('ytsearch'))) {
      cookies = await _cookies.forRun(browser);
      if (cookies != null) args.addAll(['--cookies', cookies]);
    }
    return (args: args, cookies: cookies);
  }

  static void _drop(String? path) {
    if (path == null) return;
    try {
      File(path).deleteSync();
    } catch (_) {}
  }

  static String friendly(String err) {
    final lower = err.toLowerCase();
    if (lower.contains('sign in to confirm') || lower.contains('not a bot')) {
      return 'YouTube просит подтвердить, что ты не бот. Выбери браузер в Настройках → Куки браузера для YouTube';
    }
    if (lower.contains('could not copy') && lower.contains('cookie')) {
      return 'Не получилось прочитать куки браузера. Закрой браузер и попробуй снова';
    }
    if (lower.contains('requested format is not available') || lower.contains('only images are available')) {
      return 'YouTube не отдал аудио. Проверь, что стоит JS-движок (Настройки), и обнови yt-dlp';
    }
    if (lower.contains('ffmpeg') && lower.contains('not found')) return 'Для этого трека нужен ffmpeg. Поставь его в Настройках';
    return err;
  }

  /// googlevideo links carry `expire=<unix time>`; others get a few hours.
  static DateTime _expiry(String url) {
    final exp = int.tryParse(Uri.tryParse(url)?.queryParameters['expire'] ?? '');
    final fallback = DateTime.now().add(const Duration(hours: 3));
    if (exp == null) return fallback;
    return DateTime.fromMillisecondsSinceEpoch(exp * 1000).subtract(const Duration(minutes: 5));
  }

  Future<ResolvedStream> resolve(SourceRequest req) async {
    final source = resolveSource(req);
    if (isSoundCloud(source)) {
      try {
        final s = await _sc.resolve(source);
        // SoundCloud signs its CDN links for minutes.
        return ResolvedStream(
          url: s.url,
          headers: const {'User-Agent': SoundCloud.ua},
          expires: DateTime.now().add(const Duration(minutes: 4)),
        );
      } catch (e) {
        stderr.writeln('soundcloud: $e; falling back to yt-dlp');
      }
    }
    final ytdlp = await Tools.ytdlp() ?? (throw ToolError('yt-dlp не установлен. Поставь его в Настройках'));
    final ffmpeg = (await Tools.ffmpeg())?.path;
    final base = await _baseArgs(req, source, ffmpeg);
    try {
      final out = await runTool(ytdlp.path, [
        ...base.args,
        '-f',
        'bestaudio/best',
        '--print',
        '%(http_headers)j\t%(webpage_url)s\t%(url)s',
        source,
      ], timeout: _resolveTimeout).catchError((Object e) => throw ToolError(friendly('$e')));
      final line = out.split('\n').lastWhere((l) => l.contains('\thttp'), orElse: () => throw ToolError('yt-dlp не вернул ссылку'));
      final parts = line.split('\t');
      final headers = <String, String>{};
      try {
        (jsonDecode(parts[0]) as Map).forEach((k, v) => headers['$k'] = '$v');
      } catch (_) {}
      final page = parts.length > 2 ? parts[1].trim() : '';
      final url = parts.last.trim();
      if (!_isHttp(url)) throw ToolError('yt-dlp вернул странную ссылку');
      return ResolvedStream(
        url: url,
        headers: headers,
        sourceUrl: isYoutube(page) || isSoundCloud(page) ? page : null,
        expires: _expiry(url),
      );
    } finally {
      _drop(base.cookies);
    }
  }

  /* ---------- downloads ---------- */

  static String hashed(String id) => sha256.convert(utf8.encode(id)).toString().substring(0, 20);

  /// Strips characters Windows, macOS or Linux refuse in file names.
  static String safeName(String s) {
    var out = s.replaceAll(RegExp(r'[/\\:*?"<>|\x00-\x1f]'), '_').trim();
    out = out.replaceAll(RegExp(r'\.+$'), '').trim();
    if (out.length > 150) out = out.substring(0, 150);
    return out.isEmpty ? 'track' : out;
  }

  /// A `--parse-metadata` FROM that evaluates to `s` literally: FROM is split
  /// on `:` and is a template, and a bare word would be read as a field name.
  static String _literal(String s) => '%(exos_none|)s${s.replaceAll('%', '%%').replaceAll(':', r'\:')}';

  void cancel(String id) => _jobs.remove(id)?.call();

  Future<String> _run(
    String id,
    String ytdlp,
    List<String> args,
    String scratch,
    bool converts,
    void Function(DownloadProgress) emit,
  ) async {
    Directory(scratch).createSync(recursive: true);
    final full = [
      ...args,
      // YouTube throttles long single requests; ask in 10 MB pieces.
      '--http-chunk-size', '10M',
      '--newline', '--progress',
      '--progress-template', 'download:$_progressMark\t%(progress._percent_str)s\t%(progress._speed_str)s\t%(progress._eta_str)s',
      '--print', 'after_move:$_fileMark\t%(filepath)s',
      '-P', scratch,
    ];
    emit(const DownloadProgress(Stage.resolving, 0));
    final p = await Process.start(ytdlp, full);
    var killed = false;
    _jobs[id] = () {
      killed = true;
      p.kill();
    };
    final log = StringBuffer();
    final errDone = p.stderr.transform(utf8.decoder).forEach(log.write);
    String? file;
    String? clean(String s) {
      final t = s.trim();
      return t.isEmpty || t == 'Unknown' || t == 'N/A' ? null : t;
    }

    await p.stdout.transform(utf8.decoder).transform(const LineSplitter()).forEach((line) {
      if (line.startsWith('$_progressMark\t')) {
        final f = line.split('\t');
        final pct = (double.tryParse(f[1].trim().replaceAll('%', '')) ?? 0) / 100;
        if (pct >= 1 && converts) {
          emit(const DownloadProgress(Stage.converting, 1));
        } else {
          emit(
            DownloadProgress(
              Stage.downloading,
              pct.clamp(0, 1),
              speed: clean(f.elementAtOrNull(2) ?? ''),
              eta: clean(f.elementAtOrNull(3) ?? ''),
            ),
          );
        }
      } else if (line.startsWith('$_fileMark\t')) {
        file = line.substring(_fileMark.length + 1).trim();
      }
    });
    final code = await p.exitCode;
    await errDone;
    _jobs.remove(id);
    if (killed) throw Cancelled();
    if (code != 0) throw ToolError(friendly(lastErrorLine('$log')));
    final f = file;
    if (f == null || !File(f).existsSync()) throw ToolError(friendly('yt-dlp закончил без файла. ${lastErrorLine('$log')}'));
    return f;
  }

  /// Tags (and if asked, re-encodes) a file with ffmpeg, writing `out`.
  static Future<void> _ffmpegFinish(String ffmpeg, String input, String out, DownloadRequest req, bool toMp3) async {
    final args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-map', '0:a', '-map_metadata', '-1'];
    args.addAll(toMp3 ? ['-c:a', 'libmp3lame', '-q:a', '0'] : ['-c:a', 'copy']);
    for (final (k, v) in [('title', req.title), ('artist', req.artist), ('album', req.album)]) {
      if (v != null && v.trim().isNotEmpty) args.addAll(['-metadata', '$k=$v']);
    }
    if (out.endsWith('.m4a')) args.addAll(['-movflags', '+faststart']);
    args.add(out);
    await runTool(ffmpeg, args, timeout: const Duration(minutes: 5));
  }

  /// SoundCloud straight from its API; the caller falls back to yt-dlp on error.
  Future<String> _soundcloudDownload(
    DownloadRequest req,
    String page,
    String? ffmpeg,
    String scratch,
    void Function(DownloadProgress) emit,
  ) async {
    var cancelled = false;
    _jobs[req.id] = () => cancelled = true;
    try {
      emit(const DownloadProgress(Stage.resolving, 0));
      final s = await _sc.resolve(page);
      Directory(scratch).createSync(recursive: true);
      final raw = Paths.join([scratch, 'raw.${s.ext}']);
      void progress(double f) => emit(DownloadProgress(Stage.downloading, f.clamp(0, 1)));
      if (s.hls) {
        await _sc.fetchHls(s, raw, progress, () => cancelled);
      } else {
        await _sc.fetchProgressive(s.url, raw, progress, () => cancelled);
      }
      if (cancelled) throw Cancelled();
      if (ffmpeg == null) return raw;
      final toMp3 = req.format == 'mp3' && s.ext != 'mp3';
      final out = Paths.join([scratch, 'track.${toMp3 ? 'mp3' : s.ext}']);
      emit(const DownloadProgress(Stage.converting, 1));
      try {
        await _ffmpegFinish(ffmpeg, raw, out, req, toMp3);
        return out;
      } catch (e) {
        if (toMp3) rethrow;
        stderr.writeln('ffmpeg tagging failed: $e');
        return raw; // untagged is better than nothing
      }
    } on ToolError catch (e) {
      if (cancelled || e.message == 'отменено') throw Cancelled();
      rethrow;
    } finally {
      _jobs.remove(req.id);
    }
  }

  Future<Downloaded> download(DownloadRequest req, void Function(DownloadProgress) emit) async {
    final source = resolveSource(req.src);
    final ffmpeg = (await Tools.ffmpeg())?.path;
    final soundcloud = isSoundCloud(source);
    if (soundcloud) {
      final scratch = Paths.join([Paths.workDir, 'sc-${hashed(req.id)}']);
      _rmDir(scratch);
      try {
        final file = await _soundcloudDownload(req, source, ffmpeg, scratch, emit);
        return _finish(req, file, emit);
      } on Cancelled {
        rethrow;
      } catch (e) {
        stderr.writeln('soundcloud: $e; falling back to yt-dlp');
      } finally {
        _rmDir(scratch);
      }
    }
    final ytdlp = await Tools.ytdlp() ?? (throw ToolError('yt-dlp не установлен. Поставь его в Настройках'));
    final wantMp3 = req.format == 'mp3';
    if (wantMp3 && ffmpeg == null && !soundcloud) throw ToolError('Для MP3 нужен ffmpeg. Поставь его в Настройках или выбери M4A');

    final base = await _baseArgs(req.src, source, ffmpeg);
    final args = [...base.args];
    final format = soundcloud
        ? 'http_mp3_128_url/bestaudio[protocol^=http][ext=mp3]/bestaudio[protocol^=http]/bestaudio[acodec^=mp4a]/bestaudio[ext=m4a]/bestaudio'
        : ffmpeg != null
        ? 'bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio'
        // No ffmpeg: take a single file that already plays everywhere.
        : 'bestaudio[ext=m4a]/bestaudio[acodec^=mp4a][protocol^=http]/bestaudio[protocol^=http]';
    args.addAll(['-f', format, '-o', 'track.%(ext)s']);
    var converts = false;
    if (ffmpeg != null) {
      // Copies AAC as-is into m4a; re-encodes only when the source differs.
      final target = wantMp3 || soundcloud ? 'mp3' : 'm4a';
      args.addAll(['-x', '--audio-format', target]);
      if (target == 'mp3') args.addAll(['--audio-quality', '0']);
      converts = true;
      // Tag with the Deezer/SoundCloud metadata, not YouTube's video title.
      args.add('--embed-metadata');
      for (final (v, field) in [(req.title, 'meta_title'), (req.artist, 'meta_artist'), (req.album, 'meta_album')]) {
        if (v != null && v.trim().isNotEmpty) args.addAll(['--parse-metadata', '${_literal(v)}:%($field)s']);
      }
      for (final field in const ['meta_description', 'meta_synopsis', 'meta_comment', 'meta_purl']) {
        args.addAll(['--parse-metadata', ':(?P<$field>)']);
      }
    }
    args.add(source);
    final scratch = Paths.join([Paths.workDir, hashed(req.id)]);
    _rmDir(scratch);
    try {
      final file = await _run(req.id, ytdlp.path, args, scratch, converts, emit);
      return _finish(req, file, emit);
    } finally {
      _drop(base.cookies);
      _rmDir(scratch);
    }
  }

  /// Moves a finished file into the music folder as "Artist - Title.ext".
  static Downloaded _finish(DownloadRequest req, String file, void Function(DownloadProgress) emit) {
    final dir = Directory(req.dir);
    try {
      dir.createSync(recursive: true);
    } catch (e) {
      throw ToolError('не удалось создать папку ${req.dir}: $e');
    }
    final dot = file.lastIndexOf('.');
    final ext = dot > 0 ? file.substring(dot + 1) : 'm4a';
    final stem = safeName('${req.artist} - ${req.title}');
    var dest = Paths.join([req.dir, '$stem.$ext']);
    for (var n = 2; File(dest).existsSync() && n < 1000; n++) {
      dest = Paths.join([req.dir, '$stem ($n).$ext']);
    }
    try {
      File(file).renameSync(dest);
    } on FileSystemException {
      // Different drive: copy, then remove.
      File(file).copySync(dest);
      File(file).deleteSync();
    }
    emit(const DownloadProgress(Stage.done, 1));
    return Downloaded(dest, ext);
  }

  static void _rmDir(String path) {
    try {
      Directory(path).deleteSync(recursive: true);
    } catch (_) {}
  }
}
