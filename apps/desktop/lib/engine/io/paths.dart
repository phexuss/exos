import 'dart:io';

/// Same folders the Tauri build used, so tools, the library index and
/// downloads carry over.
const _id = 'dev.phexuss.exos';

String get _home => Platform.environment['HOME'] ?? Platform.environment['USERPROFILE'] ?? Directory.systemTemp.path;

String _join(List<String> parts) => parts.join(Platform.pathSeparator);

class Paths {
  Paths._();

  static final String dataDir = () {
    final env = Platform.environment;
    if (Platform.isWindows) {
      return _join([
        env['LOCALAPPDATA'] ?? _join([_home, 'AppData', 'Local']),
        _id,
      ]);
    }
    if (Platform.isMacOS) return _join([_home, 'Library', 'Application Support', _id]);
    final xdg = env['XDG_DATA_HOME'];
    return _join([
      xdg != null && xdg.isNotEmpty ? xdg : _join([_home, '.local', 'share']),
      _id,
    ]);
  }();

  static final String _cacheRoot = () {
    final env = Platform.environment;
    if (Platform.isWindows) return _join([dataDir, 'cache']);
    if (Platform.isMacOS) return _join([_home, 'Library', 'Caches', _id]);
    final xdg = env['XDG_CACHE_HOME'];
    return _join([
      xdg != null && xdg.isNotEmpty ? xdg : _join([_home, '.cache']),
      _id,
    ]);
  }();

  /// yt-dlp, deno and ffmpeg that EXØS downloaded itself.
  static String get binDir => _join([dataDir, 'bin']);

  /// Tracks pulled down only to be played.
  static String get streamCacheDir => _join([_cacheRoot, 'stream']);

  /// Per-download scratch folders; finished files are moved out of here.
  static String get workDir => _join([dataDir, 'work']);

  static String get libraryFile => _join([dataDir, 'library.json']);

  static String? _music;

  /// ~/Music/EXØS, or the platform's music folder when it has another name.
  static Future<String> musicDir() async {
    if (_music != null) return _music!;
    var base = _join([_home, 'Music']);
    if (Platform.isLinux) {
      try {
        final r = await Process.run('xdg-user-dir', ['MUSIC']);
        final p = (r.stdout as String).trim();
        if (r.exitCode == 0 && p.isNotEmpty && p != _home) base = p;
      } catch (_) {}
    }
    return _music = _join([base, 'EXØS']);
  }

  static String join(List<String> parts) => _join(parts);

  static String exe(String name) => Platform.isWindows ? '$name.exe' : name;
}
