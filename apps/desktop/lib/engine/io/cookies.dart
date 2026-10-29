import 'dart:async';
import 'dart:io';

import '../types.dart';
import 'paths.dart';
import 'proc.dart';
import 'tools.dart';

/// Browser cookies for YouTube, read once and reused.
///
/// `--cookies-from-browser` reopens (and for Chromium decrypts) the whole
/// cookie store on every yt-dlp run, which costs seconds and fails while the
/// browser holds a lock. Instead yt-dlp exports them every half hour, and each
/// run gets its own copy: yt-dlp writes the file back on exit, and two
/// parallel runs would clobber a shared one.
class Cookies {
  static const _freshFor = Duration(minutes: 30);

  /// Cookies only a signed-in YouTube/Google session has.
  static const _signedIn = {'SAPISID', '__Secure-3PAPISID', 'LOGIN_INFO', 'SID'};

  Future<String>? _exporting;

  String _fileFor(String browser) => Paths.join([Paths.dataDir, 'cookies-$browser.txt']);

  bool _isFresh(String path) {
    final f = File(path);
    return f.existsSync() && DateTime.now().difference(f.lastModifiedSync()) < _freshFor;
  }

  /// With no URL yt-dlp exits with a usage error, but only after saving the jar.
  Future<String> _export(String browser) => _exporting ??= () async {
    try {
      final dest = _fileFor(browser);
      final ytdlp = await Tools.ytdlp() ?? (throw ToolError('yt-dlp не установлен'));
      final tmp = '$dest.new';
      try {
        File(tmp).deleteSync();
      } catch (_) {}
      Directory(Paths.dataDir).createSync(recursive: true);
      String why = '';
      try {
        await runTool(ytdlp.path, ['--ignore-config', '--cookies-from-browser', browser, '--cookies', tmp]);
      } on ToolError catch (e) {
        why = e.message;
      }
      final written = File(tmp).existsSync() && File(tmp).lengthSync() > 0;
      if (!written) {
        final lower = why.toLowerCase();
        throw ToolError(switch (lower) {
          _ when lower.contains('could not find') => 'не нашёл профиль браузера ($browser). Он установлен и хоть раз запускался?',
          _ when lower.contains('could not copy') || lower.contains('database is locked') =>
            'браузер держит куки заблокированными. Закрой его и попробуй снова',
          _ when lower.contains('keyring') || lower.contains('secretstorage') || lower.contains('decrypt') =>
            'не получилось расшифровать куки (связка ключей). Попробуй Firefox',
          _ when why.isEmpty || lower.contains('at least one url') => 'yt-dlp не выгрузил куки',
          _ => why,
        });
      }
      File(tmp).renameSync(dest);
      return dest;
    } finally {
      _exporting = null;
    }
  }();

  /// A private copy of fresh cookies for one yt-dlp run, or null when the
  /// browser can't be read (the run then goes without cookies).
  Future<String?> forRun(String browser) async {
    final shared = _fileFor(browser);
    if (!_isFresh(shared)) {
      try {
        await _export(browser);
      } catch (e) {
        stderr.writeln('cookies: $e');
        if (!File(shared).existsSync()) return null;
      }
    }
    try {
      Directory(Paths.workDir).createSync(recursive: true);
      final copy = Paths.join([Paths.workDir, 'cookies-${DateTime.now().microsecondsSinceEpoch}.txt']);
      File(shared).copySync(copy);
      return copy;
    } catch (_) {
      return null;
    }
  }

  /// Re-reads the browser now and says what came out, for the Settings check.
  Future<CookieCheck> check(String browser) async {
    final path = await _export(browser);
    var count = 0, youtube = 0;
    var signedIn = false;
    for (var line in File(path).readAsLinesSync()) {
      if (line.startsWith('#HttpOnly_')) line = line.substring('#HttpOnly_'.length);
      if (line.isEmpty || line.startsWith('#')) continue;
      final cols = line.split('\t');
      if (cols.length < 7) continue;
      count++;
      final domain = cols[0].replaceFirst(RegExp(r'^\.+'), '');
      if (domain == 'youtube.com' || domain.endsWith('.youtube.com')) {
        youtube++;
        if (_signedIn.contains(cols[5])) signedIn = true;
      }
    }
    return CookieCheck(count: count, youtube: youtube, signedIn: signedIn);
  }
}
