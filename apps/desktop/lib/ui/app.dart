import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../player/player.dart';
import '../state/auth.dart';
import '../stores.dart';
import 'clock.dart';
import 'look.dart';
import 'now_playing.dart';
import 'palette.dart';
import 'screens/login.dart';
import 'shell.dart';
import 'titlebar.dart';
import 'tokens.dart';
import 'widgets/ambient.dart';

final _navigator = GlobalKey<NavigatorState>();

class ExosApp extends StatelessWidget {
  const ExosApp({super.key});

  @override
  Widget build(BuildContext context) {
    final accent = C.accent;
    return MaterialApp(
      title: 'EXØS',
      debugShowCheckedModeBanner: false,
      navigatorKey: _navigator,
      color: C.bg,
      theme: ThemeData(
        brightness: Brightness.dark,
        fontFamily: T.family,
        scaffoldBackgroundColor: C.bg,
        canvasColor: C.bg,
        splashFactory: NoSplash.splashFactory,
        highlightColor: const Color(0x00000000),
        hoverColor: const Color(0x00000000),
        colorScheme: ColorScheme.dark(primary: accent, surface: C.surface),
        tooltipTheme: TooltipThemeData(
          decoration: BoxDecoration(
            color: C.glassMenu,
            borderRadius: BorderRadius.circular(R.sm),
            border: Border.all(color: C.glassRim),
          ),
          textStyle: T.small.copyWith(color: C.text),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        ),
        scrollbarTheme: ScrollbarThemeData(
          thumbColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.hovered) || s.contains(WidgetState.dragged) ? C.fill6 : C.fill5,
          ),
          thickness: const WidgetStatePropertyAll(6),
          radius: const Radius.circular(3),
          crossAxisMargin: 3,
        ),
      ),
      builder: (context, child) => Material(
        type: MaterialType.transparency,
        child: _AccentScope(
          child: _Keys(
            child: _NowPlayingSync(child: PlayClock(child: child!)),
          ),
        ),
      ),
      home: const _Root(),
    );
  }
}

class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) => ColoredBox(
    color: C.bg,
    child: ListenableBuilder(
      listenable: auth,
      builder: (context, _) => AnimatedSwitcher(
        duration: D.slow,
        child: switch (auth.state) {
          AuthState.signedIn => const Shell(key: ValueKey('shell')),
          AuthState.signedOut => const Stack(
            key: ValueKey('login'),
            fit: StackFit.expand,
            children: [
              AmbientBackground(palette: CoverPalette.idle, playing: false),
              LoginScreen(),
            ],
          ),
          AuthState.unknown => const Stack(
            key: ValueKey('boot'),
            fit: StackFit.expand,
            children: [
              AmbientBackground(palette: CoverPalette.idle, playing: false),
              Center(child: Wordmark()),
            ],
          ),
        },
      ),
    ),
  );
}

/// Glides the accent to each new cover's colour.
class _AccentScope extends StatelessWidget {
  const _AccentScope({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: look,
    builder: (context, _) => TweenAnimationBuilder<Color?>(
      tween: ColorTween(end: look.palette.accent),
      duration: D.lazy,
      curve: easeOut,
      builder: (context, c, _) => Accent(
        color: c ?? C.accent,
        child: TextSelectionTheme(
          data: TextSelectionThemeData(cursorColor: c, selectionColor: (c ?? C.accent).withValues(alpha: 0.35)),
          child: child,
        ),
      ),
    ),
  );
}

/// Opens and closes Now Playing as the player asks.
class _NowPlayingSync extends StatefulWidget {
  const _NowPlayingSync({required this.child});
  final Widget child;
  @override
  State<_NowPlayingSync> createState() => _NowPlayingSyncState();
}

class _NowPlayingSyncState extends State<_NowPlayingSync> {
  Route<void>? _open;

  @override
  void initState() {
    super.initState();
    player.addListener(_sync);
  }

  void _sync() {
    final nav = _navigator.currentState;
    if (nav == null) return;
    if (player.nowPlaying && _open == null) {
      final r = NowPlayingRoute();
      _open = r;
      nav.push(r).then((_) {
        _open = null;
        if (player.nowPlaying) player.setNowPlaying(false);
      });
    } else if (!player.nowPlaying && _open != null) {
      final r = _open!;
      _open = null;
      if (r.isActive) nav.removeRoute(r);
    }
  }

  @override
  void dispose() {
    player.removeListener(_sync);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

/// Player and navigation keys from anywhere, except while typing.
class _Keys extends StatelessWidget {
  const _Keys({required this.child});
  final Widget child;

  static bool _typing() {
    final ctx = FocusManager.instance.primaryFocus?.context;
    if (ctx == null) return false;
    return ctx.widget is EditableText || ctx.findAncestorWidgetOfExactType<EditableText>() != null;
  }

  KeyEventResult _onKey(FocusNode _, KeyEvent e) {
    if (e is! KeyDownEvent && e is! KeyRepeatEvent) return KeyEventResult.ignored;
    final k = e.logicalKey;
    final kb = HardwareKeyboard.instance;
    final ctrl = kb.isControlPressed || kb.isMetaPressed;
    if (ctrl && k == LogicalKeyboardKey.keyK) {
      player.setNowPlaying(false);
      openSearch();
      return KeyEventResult.handled;
    }
    if (k == LogicalKeyboardKey.escape) {
      if (player.nowPlaying) {
        player.setNowPlaying(false);
        return KeyEventResult.handled;
      }
      if (_typing()) {
        FocusManager.instance.primaryFocus?.unfocus();
        return KeyEventResult.handled;
      }
      return KeyEventResult.ignored;
    }
    if (_typing() || auth.state != AuthState.signedIn) return KeyEventResult.ignored;
    final repeat = e is KeyRepeatEvent;
    if (kb.isAltPressed) {
      if (k == LogicalKeyboardKey.arrowLeft) nav.back();
      if (k == LogicalKeyboardKey.arrowRight) nav.forward();
      return KeyEventResult.handled;
    }
    switch (k) {
      case LogicalKeyboardKey.space:
        if (!repeat) player.toggle();
      case LogicalKeyboardKey.arrowLeft:
        kb.isShiftPressed ? (repeat ? null : player.prev()) : player.seek(player.position.value - const Duration(seconds: 5));
      case LogicalKeyboardKey.arrowRight:
        kb.isShiftPressed ? (repeat ? null : player.next()) : player.seek(player.position.value + const Duration(seconds: 5));
      case LogicalKeyboardKey.arrowUp:
        player.setVolume((settings.volume + 0.05).clamp(0, 1));
      case LogicalKeyboardKey.arrowDown:
        player.setVolume((settings.volume - 0.05).clamp(0, 1));
      case LogicalKeyboardKey.slash:
        openSearch();
      case LogicalKeyboardKey.keyL:
        player.togglePanel(Panel.lyrics);
      case LogicalKeyboardKey.keyQ:
        player.togglePanel(Panel.queue);
      case LogicalKeyboardKey.keyF:
        player.setNowPlaying(!player.nowPlaying);
      default:
        return KeyEventResult.ignored;
    }
    return KeyEventResult.handled;
  }

  @override
  Widget build(BuildContext context) => Focus(autofocus: true, onKeyEvent: _onKey, child: child);
}
