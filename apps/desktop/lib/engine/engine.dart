import 'factory_stub.dart' if (dart.library.io) 'io/factory.dart';
import 'types.dart';

export 'types.dart';

/// The local audio engine: yt-dlp (+ ffmpeg, + a JS runtime for YouTube) and
/// SoundCloud's own API, all running on this computer so the services see the
/// user's IP. In mock mode (and the web prototype) it is simulated.
abstract class Engine {
  Future<EngineStatus> status();

  /// Fraction done per tool while installing.
  Stream<(Tool, double)> get installProgress;
  Future<void> install(Tool tool);
  Future<String> updateYtdlp();

  /// Keeps our yt-dlp fresh; YouTube breaks old releases every few weeks.
  Future<void> autoUpdate();

  Future<ResolvedStream> resolve(SourceRequest req);
  Future<Downloaded> download(DownloadRequest req, void Function(DownloadProgress) onProgress);
  void cancel(String id);
  Future<CookieCheck> checkCookies(String browser);

  Future<String?> readLibrary();
  Future<void> writeLibrary(String json);
  Future<void> deleteFile(String path);
  Future<bool> fileExists(String path);
  Future<void> openFolder(String path);
  Future<void> reveal(String path);
}

final Engine engine = createEngine();
