import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:window_manager/window_manager.dart';

import '../state/nav.dart';
import '../stores.dart';
import 'look.dart';
import 'tokens.dart';
import 'widgets/controls.dart';
import 'widgets/motion.dart';

bool get isDesktop =>
    !kIsWeb &&
    (defaultTargetPlatform == TargetPlatform.linux ||
        defaultTargetPlatform == TargetPlatform.windows ||
        defaultTargetPlatform == TargetPlatform.macOS);
bool get isMac => !kIsWeb && defaultTargetPlatform == TargetPlatform.macOS;

/// Empty space that moves the window when dragged and maximises on double-click.
class DragArea extends StatelessWidget {
  const DragArea({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => isDesktop ? DragToMoveArea(child: child) : child;
}

/// EXØS with the slashed O in the artwork's colour.
class Wordmark extends StatelessWidget {
  const Wordmark({super.key});

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    const s = TextStyle(fontFamily: T.family, fontSize: 17, fontWeight: FontWeight.w900, letterSpacing: 2.2, color: C.text);
    return Text.rich(
      TextSpan(
        style: s,
        children: [
          const TextSpan(text: 'EX'),
          TextSpan(
            text: 'Ø',
            style: TextStyle(color: accent),
          ),
          const TextSpan(text: 'S'),
        ],
      ),
    );
  }
}

class TitleBar extends StatelessWidget {
  const TitleBar({super.key, required this.onSearch});
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 48,
    child: DragArea(
      child: Row(
        children: [
          SizedBox(width: isMac ? 84 : 20),
          const Wordmark(),
          const SizedBox(width: 22),
          ListenableBuilder(
            listenable: nav,
            builder: (context, _) => Row(
              children: [
                IconBtn(LucideIcons.chevronLeft, tooltip: 'Назад (Alt + ←)', box: 30, onTap: nav.canBack ? nav.back : null),
                IconBtn(LucideIcons.chevronRight, tooltip: 'Вперёд (Alt + →)', box: 30, onTap: nav.canForward ? nav.forward : null),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: _SearchPill(onTap: onSearch),
            ),
          ),
          const Spacer(),
          ListenableBuilder(
            listenable: settings,
            builder: (context, _) =>
                settings.showFps ? const Padding(padding: EdgeInsets.only(right: 12), child: FpsMeter()) : const SizedBox.shrink(),
          ),
          if (isDesktop && !isMac) const WindowButtons() else const SizedBox(width: 16),
        ],
      ),
    ),
  );
}

class _SearchPill extends StatelessWidget {
  const _SearchPill({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: nav,
    builder: (context, _) {
      final r = nav.route;
      final q = r is SearchRoute ? r.query : '';
      return Tappable(
        onTap: onTap,
        builder: (context, s) => AnimatedContainer(
          duration: D.fast,
          height: 32,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: s.hovered ? C.fill3 : C.fill2,
            borderRadius: BorderRadius.circular(99),
            border: Border.all(color: s.focused ? C.glassRimStrong : C.divider),
          ),
          child: Row(
            children: [
              const Icon(LucideIcons.search, size: 15, color: C.text3),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  q.isEmpty ? 'Треки, артисты, альбомы' : q,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: T.sub.copyWith(color: q.isEmpty ? C.text4 : C.text2),
                ),
              ),
              const Text('Ctrl K', style: T.small),
            ],
          ),
        ),
      );
    },
  );
}

class WindowButtons extends StatefulWidget {
  const WindowButtons({super.key});
  @override
  State<WindowButtons> createState() => _WindowButtonsState();
}

class _WindowButtonsState extends State<WindowButtons> with WindowListener {
  bool _max = false;

  @override
  void initState() {
    super.initState();
    windowManager.addListener(this);
    windowManager.isMaximized().then((v) {
      if (mounted) setState(() => _max = v);
    });
  }

  @override
  void dispose() {
    windowManager.removeListener(this);
    super.dispose();
  }

  @override
  void onWindowMaximize() => setState(() => _max = true);
  @override
  void onWindowUnmaximize() => setState(() => _max = false);

  Widget _btn(IconData icon, String label, VoidCallback onTap, {bool close = false}) => Tooltip(
    message: label,
    waitDuration: const Duration(milliseconds: 800),
    child: Tappable(
      onTap: onTap,
      focusable: false,
      builder: (context, s) => AnimatedContainer(
        duration: D.fast,
        width: 46,
        height: 48,
        color: s.hovered ? (close ? C.winClose : C.fill3) : const Color(0x00000000),
        child: Icon(icon, size: 15, color: s.hovered ? C.text : C.text2),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) => Row(
    children: [
      _btn(LucideIcons.minus, 'Свернуть', windowManager.minimize),
      _btn(
        _max ? LucideIcons.copy : LucideIcons.square,
        _max ? 'Восстановить' : 'Развернуть',
        () => _max ? windowManager.unmaximize() : windowManager.maximize(),
      ),
      _btn(LucideIcons.x, 'Закрыть', windowManager.close, close: true),
    ],
  );
}
