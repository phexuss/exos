import 'dart:io';
import 'dart:math';

import 'package:exos_desktop/engine/io/chunk_proxy.dart';
import 'package:exos_desktop/engine/types.dart';
import 'package:flutter_test/flutter_test.dart';

/// An upstream that, like googlevideo, refuses open-ended ranges.
Future<HttpServer> _strictUpstream(List<int> data) async {
  final s = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
  s.listen((req) async {
    final m = RegExp(r'bytes=(\d+)-(\d*)').firstMatch(req.headers.value('range') ?? '');
    if (m == null || m[2]!.isEmpty || req.headers.value('x-test') != 'yes') {
      req.response.statusCode = 403;
      await req.response.close();
      return;
    }
    final a = int.parse(m[1]!), b = min(int.parse(m[2]!), data.length - 1);
    req.response
      ..statusCode = 206
      ..headers.set('content-range', 'bytes $a-$b/${data.length}')
      ..contentLength = b - a + 1
      ..add(data.sublist(a, b + 1));
    await req.response.close();
  });
  return s;
}

Future<(int, List<int>)> _get(String url, [String? range]) async {
  final c = HttpClient();
  final req = await c.getUrl(Uri.parse(url));
  if (range != null) req.headers.set('range', range);
  final res = await req.close();
  final body = await res.fold<List<int>>([], (a, b) => a..addAll(b));
  c.close();
  return (res.statusCode, body);
}

void main() {
  test('serves open-ended ranges from closed upstream chunks', () async {
    final data = List.generate(ChunkProxy.chunk * 2 + 12345, (i) => i % 251);
    final up = await _strictUpstream(data);
    final s = await ChunkProxy.instance.wrap(
      ResolvedStream(url: 'http://127.0.0.1:${up.port}/v', headers: const {'x-test': 'yes'}),
    );

    final (code, all) = await _get(s.url);
    expect(code, 200);
    expect(all, data);

    final from = ChunkProxy.chunk + 7;
    final (code2, tail) = await _get(s.url, 'bytes=$from-');
    expect(code2, 206);
    expect(tail, data.sublist(from));

    final (code3, part) = await _get(s.url, 'bytes=10-99');
    expect(code3, 206);
    expect(part, data.sublist(10, 100));

    await up.close(force: true);
  });
}
