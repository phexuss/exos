import 'dart:async';
import 'dart:io';

import '../../core/env.dart';
import '../engine.dart';
import '../mock_engine.dart';
import 'cookies.dart';
import 'paths.dart';
import 'proc.dart';
import 'soundcloud.dart';
import 'tools.dart';
import 'ytdlp.dart';

Engine createEngine() => kMock ? MockEngine() : LocalEngine();

class LocalEngine implements Engine {
  LocalEngine() {
    _tools = Tools((tool, f) => _install.add((tool, f)));
    _ytdlp = YtDlp(SoundCloud(), _cookies);
  }

  final _install = StreamController<(Tool, double)>.broadcast();
  final _cookies = Cookies();
  late final Tools _tools;
  late final YtDlp _ytdlp;

  static const _audioExts = {'m4a', 'mp3', 'opus', 'webm', 'ogg', 'flac', 'aac', 'mp4'};

  @override
  Future<EngineStatus> status() async {
    final (ytdlp, ffmpeg, js, music) = await (Tools.ytdlp(), Tools.ffmpeg(), Tools.jsRuntime(), Paths.musicDir()).wait;
    return EngineStatus(
      ytdlp: ytdlp,
      ffmpeg: ffmpeg,
      jsRuntime: js,
      musicDir: music,
      dataDir: Paths.dataDir,
      installable: Tools.installable,
    );
  }

  @override
  Stream<(Tool, double)> get installProgress => _install.stream;

  @override
  Future<void> install(Tool tool) => _tools.install(tool);

  @override
  Future<String> updateYtdlp() => _tools.updateYtdlp();

  @override
  Future<void> autoUpdate() => _tools.autoUpdate();

  @override
  Future<ResolvedStream> resolve(SourceRequest req) => _ytdlp.resolve(req);

  @override
  Future<Downloaded> download(DownloadRequest req, void Function(DownloadProgress) onProgress) => _ytdlp.download(req, onProgress);

  @override
  void cancel(String id) => _ytdlp.cancel(id);

  @override
  Future<CookieCheck> checkCookies(String browser) => _cookies.check(browser);

  @override
  Future<String?> readLibrary() async {
    final f = File(Paths.libraryFile);
    return f.existsSync() ? f.readAsString() : null;
  }

  @override
  Future<void> writeLibrary(String json) async {
    Directory(Paths.dataDir).createSync(recursive: true);
    final tmp = File('${Paths.libraryFile}.tmp');
    await tmp.writeAsString(json, flush: true);
    await tmp.rename(Paths.libraryFile);
  }

  /// Deletes a downloaded audio file; refuses anything that isn't audio.
  @override
  Future<void> deleteFile(String path) async {
    final ext = path.contains('.') ? path.substring(path.lastIndexOf('.') + 1).toLowerCase() : '';
    if (!_audioExts.contains(ext)) throw ToolError('это не аудиофайл');
    try {
      await File(path).delete();
    } on PathNotFoundException {
      // already gone
    }
  }

  @override
  Future<bool> fileExists(String path) async => File(path).existsSync();

  @override
  Future<void> openFolder(String path) async {
    Directory(path).createSync(recursive: true);
    await _open(path);
  }

  @override
  Future<void> reveal(String path) async {
    if (Platform.isWindows) {
      await Process.start('explorer.exe', ['/select,', path]);
    } else if (Platform.isMacOS) {
      await Process.start('open', ['-R', path]);
    } else {
      await _open(File(path).parent.path);
    }
  }

  static Future<void> _open(String path) async {
    final cmd = Platform.isWindows
        ? 'explorer.exe'
        : Platform.isMacOS
        ? 'open'
        : 'xdg-open';
    await Process.start(cmd, [path], mode: ProcessStartMode.detached);
  }
}
