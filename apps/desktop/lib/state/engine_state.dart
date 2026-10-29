import 'dart:async';

import 'package:flutter/foundation.dart';

import '../engine/engine.dart';
import 'toast.dart';

const toolNames = {Tool.ytdlp: 'yt-dlp', Tool.ffmpeg: 'ffmpeg', Tool.deno: 'Deno'};

class EngineState extends ChangeNotifier {
  EngineState(this._toasts) {
    _sub = engine.installProgress.listen((p) {
      installing = p;
      notifyListeners();
    });
  }
  final Toasts _toasts;
  late final StreamSubscription<(Tool, double)> _sub;

  EngineStatus? status;
  String? error;

  /// Tool being installed and its download progress (0..1).
  (Tool, double)? installing;
  bool updating = false;

  Future<void> refresh() async {
    try {
      status = await engine.status();
      error = null;
    } catch (e) {
      error = '$e';
    }
    notifyListeners();
  }

  Future<void> install(Tool tool) async {
    installing = (tool, 0);
    notifyListeners();
    try {
      await engine.install(tool);
      _toasts.show('${toolNames[tool]} установлен');
    } catch (e) {
      _toasts.show('Не удалось установить ${toolNames[tool]}: $e', ToastKind.error);
    } finally {
      installing = null;
      await refresh();
    }
  }

  Future<void> updateYtdlp() async {
    updating = true;
    notifyListeners();
    try {
      _toasts.show('yt-dlp обновлён: ${await engine.updateYtdlp()}');
    } catch (e) {
      _toasts.show('Не удалось обновить yt-dlp: $e', ToastKind.error);
    } finally {
      updating = false;
      await refresh();
    }
  }

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}
