import 'package:flutter/foundation.dart';

import '../core/prefs.dart';

class Settings extends ChangeNotifier {
  Settings() {
    cookiesBrowser = Prefs.str('exos.cookiesBrowser') ?? '';
    format = Prefs.str('exos.format') ?? 'm4a';
    musicDir = Prefs.str('exos.musicDir');
    volume = Prefs.num('exos.volume') ?? 0.8;
    liveBlur = Prefs.flag('exos.liveBlur') ?? true;
    showFps = Prefs.flag('exos.showFps') ?? false;
  }

  /// Browser yt-dlp reads YouTube cookies from; empty for none.
  late String cookiesBrowser;

  /// m4a keeps YouTube's AAC as-is; mp3 re-encodes.
  late String format;

  /// Where downloads go; null for ~/Music/EXØS.
  late String? musicDir;
  late double volume;

  /// Frosted panels over the moving background. Off draws tinted glass only.
  late bool liveBlur;

  /// Frame-rate readout in the corner, to check the display's refresh rate.
  late bool showFps;

  void set({
    String? cookiesBrowser,
    String? format,
    String? musicDir,
    bool clearMusicDir = false,
    double? volume,
    bool? liveBlur,
    bool? showFps,
  }) {
    if (cookiesBrowser != null) Prefs.set('exos.cookiesBrowser', this.cookiesBrowser = cookiesBrowser);
    if (format != null) Prefs.set('exos.format', this.format = format);
    if (musicDir != null || clearMusicDir) Prefs.set('exos.musicDir', this.musicDir = musicDir);
    if (volume != null) Prefs.set('exos.volume', this.volume = volume);
    if (liveBlur != null) Prefs.set('exos.liveBlur', this.liveBlur = liveBlur);
    if (showFps != null) Prefs.set('exos.showFps', this.showFps = showFps);
    notifyListeners();
  }
}
