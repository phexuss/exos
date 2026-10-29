import 'dart:async';
import 'dart:convert';
import 'dart:io';

/// Runs a tool and returns trimmed stdout, or stderr's last useful line as the error.
Future<String> runTool(String exe, List<String> args, {Duration timeout = const Duration(seconds: 60)}) async {
  final p = await Process.start(exe, args);
  final out = p.stdout.transform(utf8.decoder).join();
  final err = p.stderr.transform(utf8.decoder).join();
  final code = await p.exitCode.timeout(
    timeout,
    onTimeout: () {
      p.kill();
      throw ToolError('$exe не ответил за ${timeout.inSeconds} с');
    },
  );
  if (code == 0) return (await out).trim();
  throw ToolError(lastErrorLine(await err));
}

class ToolError implements Exception {
  ToolError(this.message);
  final String message;
  @override
  String toString() => message;
}

/// The most useful line of a yt-dlp / ffmpeg error log.
String lastErrorLine(String stderr) {
  final lines = stderr.split('\n').map((l) => l.trim()).where((l) => l.isNotEmpty).toList();
  if (lines.isEmpty) return 'неизвестная ошибка';
  final err = lines.lastWhere((l) => l.startsWith('ERROR'), orElse: () => lines.last);
  return err.replaceFirst('ERROR:', '').trim();
}
