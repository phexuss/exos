import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:media_kit/media_kit.dart';
import 'package:window_manager/window_manager.dart';

import 'core/env.dart';
import 'core/prefs.dart';
import 'engine/engine.dart';
import 'stores.dart';
import 'ui/app.dart';
import 'ui/titlebar.dart';
import 'ui/tokens.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (!kMock) MediaKit.ensureInitialized(libmpv: _bundledLibmpv());
  await Prefs.init();
  createStores();

  if (isDesktop) {
    await windowManager.ensureInitialized();
    await windowManager.waitUntilReadyToShow(
      const WindowOptions(
        title: 'EXØS',
        size: Size(1440, 900),
        minimumSize: Size(900, 620),
        center: true,
        backgroundColor: C.bg,
        titleBarStyle: TitleBarStyle.hidden,
      ),
      () async {
        await windowManager.show();
        await windowManager.focus();
      },
    );
  }

  runApp(const ExosApp());

  auth.bootstrap();
  library.load();
  engineState.refresh().then((_) async {
    // Keeps yt-dlp current; YouTube changes break old versions within weeks.
    await engine.autoUpdate();
    await engineState.refresh();
  });
}

/// A Linux build can carry its own libmpv in lib/mpv (with its dependencies
/// next to it), for systems where the mpv package can't be installed.
String? _bundledLibmpv() {
  if (kIsWeb || !Platform.isLinux) return null;
  final lib = File('${File(Platform.resolvedExecutable).parent.path}/lib/mpv/libmpv.so.2');
  return lib.existsSync() ? lib.path : null;
}
