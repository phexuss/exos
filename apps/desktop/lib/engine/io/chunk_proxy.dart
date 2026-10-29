import 'dart:async';
import 'dart:io';
import 'dart:math';

import '../types.dart';

/// googlevideo answers 403 to an open-ended `Range: bytes=N-`, which is what
/// mpv (ffmpeg) sends. This loopback server takes mpv's requests and fetches
/// upstream in closed 10 MiB ranges, the same trick the Tauri build used.
/// If upstream refuses mid-stream the response simply ends early; the player
/// treats that as a dropped stream and resolves a fresh link.
class ChunkProxy {
  ChunkProxy._();
  static final instance = ChunkProxy._();

  static const chunk = 10 * 1024 * 1024;

  /// Hosts that need it.
  static bool wants(String url) => Uri.tryParse(url)?.host.endsWith('.googlevideo.com') ?? false;

  HttpServer? _server;
  Future<HttpServer>? _starting;
  final _client = HttpClient()..connectionTimeout = const Duration(seconds: 15);
  final _streams = <String, ResolvedStream>{};
  var _next = 0;

  Future<HttpServer> _start() => _starting ??= HttpServer.bind(InternetAddress.loopbackIPv4, 0).then((s) {
    _server = s;
    s.listen(_handle);
    return s;
  });

  /// A local URL that serves [s]; mpv opens it without headers.
  Future<ResolvedStream> wrap(ResolvedStream s) async {
    final server = await _start();
    final id = '${_next++}';
    _streams[id] = s;
    // Older links are dead anyway; keep the map small.
    if (_streams.length > 16) _streams.remove(_streams.keys.first);
    return ResolvedStream(url: 'http://127.0.0.1:${server.port}/s/$id', sourceUrl: s.sourceUrl, expires: s.expires);
  }

  Future<HttpClientResponse> _get(ResolvedStream s, int from, int to, {bool head = false}) async {
    final req = await (head ? _client.headUrl(Uri.parse(s.url)) : _client.getUrl(Uri.parse(s.url)));
    s.headers.forEach((k, v) {
      if (k.toLowerCase() != 'range') req.headers.set(k, v);
    });
    req.headers.set(HttpHeaders.rangeHeader, 'bytes=$from-$to');
    return req.close();
  }

  static (int, int?)? _range(String? h) {
    final m = RegExp(r'bytes=(\d+)-(\d*)').firstMatch(h ?? '');
    if (m == null) return null;
    return (int.parse(m[1]!), m[2]!.isEmpty ? null : int.parse(m[2]!));
  }

  static int? _total(HttpClientResponse r) {
    final m = RegExp(r'/(\d+)$').firstMatch(r.headers.value(HttpHeaders.contentRangeHeader) ?? '');
    return m == null ? null : int.parse(m[1]!);
  }

  Future<void> _handle(HttpRequest req) async {
    final res = req.response;
    final s = req.uri.pathSegments.length == 2 ? _streams[req.uri.pathSegments[1]] : null;
    if (s == null) {
      res.statusCode = HttpStatus.notFound;
      await res.close();
      return;
    }
    final asked = _range(req.headers.value(HttpHeaders.rangeHeader));
    final from = asked?.$1 ?? 0;
    final head = req.method == 'HEAD';
    try {
      var stop = asked?.$2 ?? (1 << 62);
      final first = await _get(s, from, min(stop, from + chunk - 1), head: head);
      if (first.statusCode >= 400) {
        stderr.writeln('chunk proxy: upstream answered ${first.statusCode} (${Uri.parse(s.url).host}, bytes=$from-)');
        await first.drain<void>();
        res.statusCode = first.statusCode == 416 ? 416 : HttpStatus.badGateway;
        await res.close();
        return;
      }
      final total = _total(first);
      res.headers.set(HttpHeaders.acceptRangesHeader, 'bytes');
      final type = first.headers.contentType;
      if (type != null) res.headers.contentType = type;
      if (first.statusCode != 206 || total == null) {
        // Upstream ignored Range: pass the whole thing through.
        res.statusCode = HttpStatus.ok;
        if (first.contentLength >= 0) res.contentLength = first.contentLength;
        if (!head) await res.addStream(first);
        await res.close();
        return;
      }
      stop = min(stop, total - 1);
      res.statusCode = asked == null ? HttpStatus.ok : HttpStatus.partialContent;
      res.contentLength = stop + 1 - from;
      if (asked != null) res.headers.set(HttpHeaders.contentRangeHeader, 'bytes $from-$stop/$total');
      if (head) {
        await first.drain<void>();
        await res.close();
        return;
      }
      var pos = from;
      var body = first;
      while (true) {
        var got = 0;
        await res.addStream(body.map((b) {
          got += b.length;
          return b;
        }));
        pos += got;
        if (got == 0 || pos > stop) break;
        body = await _get(s, pos, min(stop, pos + chunk - 1));
        if (body.statusCode != 206) {
          stderr.writeln('chunk proxy: upstream answered ${body.statusCode} mid-stream (bytes=$pos-)');
          await body.drain<void>();
          break;
        }
      }
      await res.close();
    } catch (e) {
      // mpv closed the connection (seek, next track) or upstream failed.
      try {
        await res.close();
      } catch (_) {}
    }
  }

  Future<void> close() async {
    await _server?.close(force: true);
    _client.close(force: true);
  }
}
