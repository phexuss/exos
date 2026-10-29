import 'dart:async';
import 'dart:ffi' show Abi;
import 'dart:io';

import 'package:archive/archive_io.dart';

import '../types.dart';
import 'paths.dart';
import 'proc.dart';

/// Finding, installing and updating the tools the engine runs on: yt-dlp, a
/// JavaScript runtime it uses for YouTube's challenges (Deno by default), and
/// ffmpeg for format conversion and tagging.
class Tools {
  Tools(this._onProgress);
  final void Function(Tool, double) _onProgress;

  static const _ua = 'EXOS-desktop/0.3';

  /// GUI apps on macOS start with a bare PATH; Homebrew lives outside it.
  static List<String> _extraDirs() {
    final home = Platform.environment['HOME'] ?? Platform.environment['USERPROFILE'];
    return [
      if (Platform.isMacOS) ...['/opt/homebrew/bin', '/usr/local/bin'],
      if (Platform.isLinux) ...['/usr/local/bin', '/usr/bin'],
      if (home != null) ...[
        Paths.join([home, '.deno', 'bin']),
        Paths.join([home, '.bun', 'bin']),
        Paths.join([home, '.local', 'bin']),
      ],
    ];
  }

  static String? _onPath(String name) {
    final sep = Platform.isWindows ? ';' : ':';
    final exts = Platform.isWindows ? ['.exe', '.cmd', '.bat'] : [''];
    for (final dir in (Platform.environment['PATH'] ?? '').split(sep)) {
      if (dir.isEmpty) continue;
      for (final ext in exts) {
        final p = Paths.join([dir, '$name$ext']);
        if (File(p).existsSync()) return p;
      }
    }
    return null;
  }

  /// The unpacked ("onedir") yt-dlp build: the executable plus `_internal`.
  /// It starts several times faster than the single-file build, which unpacks
  /// a whole Python runtime to a temp folder on every run.
  static String get _ytdlpDist => Paths.join([Paths.binDir, 'yt-dlp-dist']);

  static String? _ytdlpIn(String dir) {
    final d = Directory(dir);
    if (!d.existsSync()) return null;
    for (final e in d.listSync()) {
      final name = e.uri.pathSegments.last;
      if (e is File && name.startsWith('yt-dlp') && (!Platform.isWindows || name.endsWith('.exe'))) return e.path;
    }
    return null;
  }

  /// Our own copy first, then PATH, then the usual install locations.
  static (String, bool)? locate(String name) {
    if (name == 'yt-dlp') {
      final p = _ytdlpIn(_ytdlpDist);
      if (p != null) return (p, true);
    }
    final managed = Paths.join([Paths.binDir, Paths.exe(name)]);
    if (File(managed).existsSync()) return (managed, true);
    final onPath = _onPath(name);
    if (onPath != null) return (onPath, false);
    for (final dir in _extraDirs()) {
      final p = Paths.join([dir, Paths.exe(name)]);
      if (File(p).existsSync()) return (p, false);
    }
    return null;
  }

  /// Version lines by path and modification time: asking a PyInstaller yt-dlp
  /// costs a second or more, and every play looks the tools up.
  static final _versions = <String, (DateTime, String)>{};

  static Future<String?> _versionOf(String path, List<String> args) async {
    DateTime? mtime;
    try {
      mtime = File(path).lastModifiedSync();
    } catch (_) {}
    final cached = _versions[path];
    if (cached != null && cached.$1 == mtime) return cached.$2;
    try {
      final out = await runTool(path, args, timeout: const Duration(seconds: 20));
      final first = out.split('\n').first.trim();
      if (mtime != null) _versions[path] = (mtime, first);
      return first;
    } catch (_) {
      return null;
    }
  }

  static Future<ToolInfo?> ytdlp() async {
    final l = locate('yt-dlp');
    if (l == null) return null;
    final v = await _versionOf(l.$1, ['--version']);
    return v == null ? null : ToolInfo(path: l.$1, version: v, managed: l.$2);
  }

  static Future<ToolInfo?> ffmpeg() async {
    final l = locate('ffmpeg');
    if (l == null) return null;
    final line = await _versionOf(l.$1, ['-version']);
    if (line == null) return null;
    // "ffmpeg version 7.1-full_build-www.gyan.dev Copyright ..."
    final words = line.split(RegExp(r'\s+'));
    final v = words.length > 2 ? words[2].split(RegExp(r'[-+]')).first : '?';
    return ToolInfo(path: l.$1, version: v, managed: l.$2);
  }

  static Future<ToolInfo?> jsRuntime() async {
    for (final name in const ['deno', 'node', 'bun']) {
      final l = locate(name);
      if (l == null) continue;
      final v = await _versionOf(l.$1, ['--version']);
      if (v == null) continue;
      // deno prints "deno 2.5.4 (stable, ...)", node "v22.1.0", bun "1.2.3".
      final version = v.replaceFirst('deno ', '').replaceFirst(RegExp('^v'), '').split(RegExp(r'\s+')).first;
      return ToolInfo(path: l.$1, version: version, managed: l.$2, name: name);
    }
    return null;
  }

  /* ---------- install ---------- */

  static final Abi _abi = Abi.current();

  /// The unpacked builds; see `_ytdlpDist`.
  static String? get ytdlpAsset => switch (_abi) {
    Abi.windowsX64 => 'yt-dlp_win.zip',
    Abi.windowsArm64 => 'yt-dlp_win_arm64.zip',
    Abi.windowsIA32 => 'yt-dlp_win_x86.zip',
    Abi.macosX64 || Abi.macosArm64 => 'yt-dlp_macos.zip',
    Abi.linuxX64 => 'yt-dlp_linux.zip',
    Abi.linuxArm64 => 'yt-dlp_linux_aarch64.zip',
    _ => null,
  };

  static String? get _denoTarget => switch (_abi) {
    Abi.windowsX64 => 'x86_64-pc-windows-msvc',
    Abi.macosX64 => 'x86_64-apple-darwin',
    Abi.macosArm64 => 'aarch64-apple-darwin',
    Abi.linuxX64 => 'x86_64-unknown-linux-gnu',
    Abi.linuxArm64 => 'aarch64-unknown-linux-gnu',
    _ => null,
  };

  /// Static ffmpeg zips exist only for Windows (yt-dlp's FFmpeg-Builds);
  /// elsewhere the system package manager does a better job.
  static String? get _ffmpegAsset => switch (_abi) {
    Abi.windowsX64 => 'ffmpeg-master-latest-win64-gpl.zip',
    Abi.windowsArm64 => 'ffmpeg-master-latest-winarm64-gpl.zip',
    _ => null,
  };

  static Set<Tool> get installable => {
    if (ytdlpAsset != null) Tool.ytdlp,
    if (_denoTarget != null) Tool.deno,
    if (_ffmpegAsset != null) Tool.ffmpeg,
  };

  Future<void> _download(Tool tool, String url, String dest) async {
    final client = HttpClient()..userAgent = _ua;
    try {
      final req = await client.getUrl(Uri.parse(url));
      final res = await req.close();
      if (res.statusCode >= 400) throw ToolError('не скачалось $url: ${res.statusCode}');
      final total = res.contentLength;
      final sink = File(dest).openWrite();
      var done = 0, lastEmit = 0;
      try {
        await for (final chunk in res) {
          sink.add(chunk);
          done += chunk.length;
          if (total > 0 && (done - lastEmit) / total > 0.01) {
            lastEmit = done;
            _onProgress(tool, done / total);
          }
        }
      } finally {
        await sink.close();
      }
    } on SocketException catch (e) {
      throw ToolError('обрыв загрузки: ${e.message}');
    } finally {
      client.close();
    }
  }

  static Future<void> _chmodX(String path) async {
    if (Platform.isWindows) return;
    await Process.run('chmod', ['755', path]);
  }

  /// Unpacks a whole archive into `into`, keeping folders and exec bits.
  static Future<void> _extractAll(String zip, String into) async {
    final input = InputFileStream(zip);
    try {
      final archive = ZipDecoder().decodeStream(input);
      for (final f in archive) {
        final dest = Paths.join([into, ...f.name.split('/').where((s) => s.isNotEmpty && s != '..')]);
        if (!f.isFile) {
          Directory(dest).createSync(recursive: true);
          continue;
        }
        File(dest).parent.createSync(recursive: true);
        final out = OutputFileStream(dest);
        f.writeContent(out);
        await out.close();
        if (!Platform.isWindows && (f.mode & 0x49) != 0) await _chmodX(dest);
      }
    } finally {
      await input.close();
    }
  }

  /// Pulls the named entries (matched by file name, any folder) out of a zip.
  static Future<void> _extract(String zip, List<String> wanted, String into) async {
    final input = InputFileStream(zip);
    var found = 0;
    try {
      final archive = ZipDecoder().decodeStream(input);
      for (final f in archive) {
        final name = f.name.split('/').last;
        if (!f.isFile || !wanted.contains(name)) continue;
        final dest = Paths.join([into, name]);
        final out = OutputFileStream(dest);
        f.writeContent(out);
        await out.close();
        await _chmodX(dest);
        found++;
      }
    } finally {
      await input.close();
    }
    if (found == 0) throw ToolError('в архиве нет ${wanted.join(', ')}');
  }

  Future<void> _installYtdlp() async {
    final bin = Paths.binDir;
    final asset = ytdlpAsset ?? (throw ToolError('под эту систему нет готового yt-dlp'));
    final tmp = Paths.join([bin, 'yt-dlp.zip.part']);
    await _download(Tool.ytdlp, 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/$asset', tmp);
    final fresh = Paths.join([bin, 'yt-dlp-dist.new']);
    final old = Paths.join([bin, 'yt-dlp-dist.old']);
    await _rmDir(fresh);
    try {
      await _extractAll(tmp, fresh);
    } finally {
      await _rm(tmp);
    }
    final main = _ytdlpIn(fresh) ?? (throw ToolError('в архиве yt-dlp нет исполняемого файла'));
    await _chmodX(main);
    // Swap folders. On Windows this fails while a yt-dlp from the old folder
    // is running; the old one then stays and the next start tries again.
    await _rmDir(old);
    if (Directory(_ytdlpDist).existsSync()) {
      try {
        await Directory(_ytdlpDist).rename(old);
      } on FileSystemException catch (e) {
        throw ToolError('yt-dlp сейчас занят, обновлю позже: ${e.message}');
      }
    }
    await Directory(fresh).rename(_ytdlpDist);
    await _rmDir(old);
    // The single-file build from earlier versions of EXØS.
    await _rm(Paths.join([bin, Paths.exe('yt-dlp')]));
    File(Paths.join([Paths.dataDir, 'ytdlp-updated'])).writeAsStringSync('');
  }

  Future<void> install(Tool tool) async {
    final bin = Paths.binDir;
    Directory(bin).createSync(recursive: true);
    switch (tool) {
      case Tool.ytdlp:
        await _installYtdlp();
      case Tool.deno:
        final target = _denoTarget ?? (throw ToolError('под эту систему нет готового Deno'));
        final tmp = Paths.join([bin, 'deno.zip.part']);
        await _download(tool, 'https://github.com/denoland/deno/releases/latest/download/deno-$target.zip', tmp);
        try {
          await _extract(tmp, [Paths.exe('deno')], bin);
        } finally {
          await _rm(tmp);
        }
      case Tool.ffmpeg:
        final asset = _ffmpegAsset ?? (throw ToolError('ffmpeg ставится через систему: brew install ffmpeg или пакет ffmpeg'));
        final tmp = Paths.join([bin, 'ffmpeg.zip.part']);
        await _download(tool, 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/$asset', tmp);
        try {
          await _extract(tmp, [Paths.exe('ffmpeg'), Paths.exe('ffprobe')], bin);
        } finally {
          await _rm(tmp);
        }
    }
    _onProgress(tool, 1);
  }

  /// The newest release tag, read from GitHub's redirect without the API.
  static Future<String> _latestYtdlpTag() async {
    final client = HttpClient()..userAgent = _ua;
    try {
      final req = await client.getUrl(Uri.parse('https://github.com/yt-dlp/yt-dlp/releases/latest'));
      req.followRedirects = false;
      final res = await req.close();
      await res.drain<void>();
      final loc = res.headers.value('location') ?? (throw ToolError('GitHub не ответил редиректом'));
      final tag = loc.split('/').last;
      if (tag.isEmpty) throw ToolError('нет тега');
      return tag;
    } finally {
      client.close();
    }
  }

  /// Updates our own copy to the latest release. A system yt-dlp belongs to
  /// its package manager.
  Future<String> updateYtdlp() async {
    final l = locate('yt-dlp') ?? (throw ToolError('yt-dlp не установлен'));
    if (!l.$2) throw ToolError('это системный yt-dlp (${l.$1}), обнови его тем же способом, каким ставил');
    if (l.$1.startsWith(_ytdlpDist)) {
      final latest = await _latestYtdlpTag();
      if (await _versionOf(l.$1, ['--version']) == latest) {
        File(Paths.join([Paths.dataDir, 'ytdlp-updated'])).writeAsStringSync('');
        return latest;
      }
    }
    await _installYtdlp();
    final now = locate('yt-dlp') ?? (throw ToolError('yt-dlp не установился'));
    return await _versionOf(now.$1, ['--version']) ?? (throw ToolError('yt-dlp не запускается'));
  }

  /// At most once a day; a single-file copy from an earlier version is
  /// swapped for the unpacked build right away.
  Future<void> autoUpdate() async {
    final l = locate('yt-dlp');
    if (l == null || !l.$2) return;
    final legacy = !l.$1.startsWith(_ytdlpDist);
    final stamp = File(Paths.join([Paths.dataDir, 'ytdlp-updated']));
    final fresh = stamp.existsSync() && DateTime.now().difference(stamp.lastModifiedSync()) < const Duration(hours: 20);
    if (fresh && !legacy) return;
    try {
      await updateYtdlp();
    } catch (e) {
      stderr.writeln('yt-dlp update: $e');
    }
  }

  static Future<void> _rm(String path) async {
    try {
      await File(path).delete();
    } catch (_) {}
  }

  static Future<void> _rmDir(String path) async {
    try {
      await Directory(path).delete(recursive: true);
    } catch (_) {}
  }
}
