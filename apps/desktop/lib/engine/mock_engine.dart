import 'dart:async';
import 'dart:math';

import 'engine.dart';

const _status = EngineStatus(
  ytdlp: ToolInfo(path: '~/.local/share/dev.phexuss.exos/bin/yt-dlp-dist/yt-dlp_linux', version: '2026.10.22', managed: true),
  ffmpeg: ToolInfo(path: '/usr/bin/ffmpeg', version: '7.1', managed: false),
  jsRuntime: ToolInfo(path: '~/.local/share/dev.phexuss.exos/bin/deno', version: '2.5.4', managed: true, name: 'deno'),
  musicDir: '~/Music/EXØS',
  dataDir: '~/.local/share/dev.phexuss.exos',
  installable: {Tool.ytdlp, Tool.ffmpeg, Tool.deno},
);

/// A simulated engine for the design prototype and UI work.
class MockEngine implements Engine {
  final _install = StreamController<(Tool, double)>.broadcast();
  final _cancelled = <String>{};
  String? _library;

  @override
  Future<EngineStatus> status() async => _status;

  @override
  Stream<(Tool, double)> get installProgress => _install.stream;

  @override
  Future<void> install(Tool tool) async {
    for (var i = 1; i <= 10; i++) {
      await Future.delayed(const Duration(milliseconds: 120));
      _install.add((tool, i / 10));
    }
  }

  @override
  Future<String> updateYtdlp() async => '2026.10.22';

  @override
  Future<void> autoUpdate() async {}

  @override
  Future<ResolvedStream> resolve(SourceRequest req) =>
      Future.delayed(const Duration(milliseconds: 700), () => const ResolvedStream(url: 'mock://stream'));

  @override
  Future<Downloaded> download(DownloadRequest req, void Function(DownloadProgress) onProgress) async {
    final rnd = Random();
    onProgress(const DownloadProgress(Stage.resolving, 0));
    await Future.delayed(const Duration(milliseconds: 900));
    var p = 0.0;
    while (p < 1) {
      if (_cancelled.remove(req.id)) throw Cancelled();
      await Future.delayed(const Duration(milliseconds: 220));
      p = min(1, p + 0.06 + rnd.nextDouble() * 0.08);
      onProgress(DownloadProgress(Stage.downloading, p, speed: '6.2MiB/s', eta: '00:02'));
    }
    return Downloaded('${req.dir}/${req.artist} - ${req.title}.${req.format}', req.format);
  }

  @override
  void cancel(String id) => _cancelled.add(id);

  @override
  Future<CookieCheck> checkCookies(String browser) =>
      Future.delayed(const Duration(milliseconds: 600), () => const CookieCheck(count: 0, youtube: 0, signedIn: false));

  @override
  Future<String?> readLibrary() async => _library;

  @override
  Future<void> writeLibrary(String json) async => _library = json;

  @override
  Future<void> deleteFile(String path) async {}

  @override
  Future<bool> fileExists(String path) async => true;

  @override
  Future<void> openFolder(String path) async {}

  @override
  Future<void> reveal(String path) async {}
}
