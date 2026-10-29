import 'dart:ui' show FramePhase;

import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import '../look.dart';
import '../tokens.dart';

bool reduceMotion(BuildContext context) => MediaQuery.maybeDisableAnimationsOf(context) ?? false;

/// Arrives by rising a little and fading in, `index` steps after its siblings.
class Rise extends StatefulWidget {
  const Rise({super.key, required this.child, this.index = 0, this.offset = 14});
  final Widget child;
  final int index;
  final double offset;

  @override
  State<Rise> createState() => _RiseState();
}

class _RiseState extends State<Rise> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: D.slow);

  @override
  void initState() {
    super.initState();
    final delay = D.stagger * widget.index.clamp(0, 10);
    if (delay == Duration.zero) {
      _c.forward();
    } else {
      Future.delayed(delay, () {
        if (mounted) _c.forward();
      });
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (reduceMotion(context)) return widget.child;
    return AnimatedBuilder(
      animation: _c,
      child: widget.child,
      builder: (context, child) {
        final t = spring.transform(_c.value);
        return Opacity(
          opacity: Curves.easeOut.transform(_c.value).clamp(0, 1),
          child: Transform.translate(offset: Offset(0, (1 - t) * widget.offset), child: child),
        );
      },
    );
  }
}

/// Hover and press state for anything clickable, with the pointer position
/// for effects that follow it.
class Tappable extends StatefulWidget {
  const Tappable({
    super.key,
    required this.builder,
    this.onTap,
    this.onDoubleTap,
    this.onSecondaryTapUp,
    this.cursor = SystemMouseCursors.click,
    this.focusable = true,
  });
  final Widget Function(BuildContext context, TapState s) builder;
  final VoidCallback? onTap;
  final VoidCallback? onDoubleTap;
  final void Function(TapUpDetails)? onSecondaryTapUp;
  final MouseCursor cursor;
  final bool focusable;

  @override
  State<Tappable> createState() => _TappableState();
}

class TapState {
  const TapState(this.hovered, this.pressed, this.focused, this.pointer);
  final bool hovered;
  final bool pressed;
  final bool focused;
  final Offset? pointer;
}

class _TappableState extends State<Tappable> {
  bool _hover = false, _down = false, _focus = false;
  Offset? _pointer;

  @override
  Widget build(BuildContext context) {
    return FocusableActionDetector(
      enabled: widget.focusable && widget.onTap != null,
      mouseCursor: widget.onTap == null && widget.onDoubleTap == null ? MouseCursor.defer : widget.cursor,
      onShowFocusHighlight: (v) => setState(() => _focus = v),
      actions: {ActivateIntent: CallbackAction<ActivateIntent>(onInvoke: (_) => widget.onTap?.call())},
      shortcuts: const {SingleActivator(LogicalKeyboardKey.enter): ActivateIntent()},
      child: MouseRegion(
        onEnter: (e) => setState(() {
          _hover = true;
          _pointer = e.localPosition;
        }),
        onHover: (e) => setState(() => _pointer = e.localPosition),
        onExit: (_) => setState(() {
          _hover = false;
          _down = false;
        }),
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapDown: widget.onTap == null ? null : (_) => setState(() => _down = true),
          onTapUp: widget.onTap == null ? null : (_) => setState(() => _down = false),
          onTapCancel: () => setState(() => _down = false),
          onTap: widget.onTap,
          onDoubleTap: widget.onDoubleTap,
          onSecondaryTapUp: widget.onSecondaryTapUp,
          child: widget.builder(context, TapState(_hover, _down, _focus, _pointer)),
        ),
      ),
    );
  }
}

/// A soft light tinted by the accent that follows the pointer over a row.
class Spot extends StatelessWidget {
  const Spot({super.key, required this.state, required this.child, this.radius = 12, this.base, this.selected = false});
  final TapState state;
  final Widget child;
  final double radius;
  final Color? base;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    final p = state.pointer;
    return AnimatedContainer(
      duration: D.fast,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        color: selected ? C.fill3 : (state.hovered ? C.hover : base ?? const Color(0x00000000)),
        border: state.focused ? Border.all(color: C.glassRimStrong) : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: CustomPaint(
          painter: state.hovered && p != null ? _SpotPainter(p, accent) : null,
          child: AnimatedScale(scale: state.pressed ? 0.985 : 1, duration: D.fast, curve: spring, child: child),
        ),
      ),
    );
  }
}

class _SpotPainter extends CustomPainter {
  _SpotPainter(this.at, this.accent);
  final Offset at;
  final Color accent;

  @override
  void paint(Canvas canvas, Size size) {
    const r = 180.0;
    canvas.drawCircle(
      at,
      r,
      Paint()
        ..shader = RadialGradient(colors: [accent.withValues(alpha: 0.16), accent.withValues(alpha: 0)])
            .createShader(Rect.fromCircle(center: at, radius: r)),
    );
  }

  @override
  bool shouldRepaint(_SpotPainter old) => old.at != at || old.accent != accent;
}

/// Gives a child a gentle spring scale on hover and press.
class Bouncy extends StatelessWidget {
  const Bouncy({super.key, required this.state, required this.child, this.hover = 1.04, this.press = 0.94});
  final TapState state;
  final Widget child;
  final double hover;
  final double press;

  @override
  Widget build(BuildContext context) => AnimatedScale(
    scale: state.pressed ? press : (state.hovered ? hover : 1),
    duration: state.pressed ? D.fast : D.mid,
    curve: spring,
    child: child,
  );
}

/// Frames per second actually presented, from the engine's frame timings.
class FpsMeter extends StatefulWidget {
  const FpsMeter({super.key});
  @override
  State<FpsMeter> createState() => _FpsMeterState();
}

class _FpsMeterState extends State<FpsMeter> {
  final _stamps = <int>[];
  int _fps = 0;
  double _worstMs = 0;

  @override
  void initState() {
    super.initState();
    SchedulerBinding.instance.addTimingsCallback(_onTimings);
  }

  void _onTimings(List<FrameTiming> timings) {
    for (final t in timings) {
      _stamps.add(t.timestampInMicroseconds(FramePhase.vsyncStart));
    }
    final now = _stamps.isEmpty ? 0 : _stamps.last;
    _stamps.removeWhere((s) => now - s > 1000000);
    var worst = 0;
    for (var i = 1; i < _stamps.length; i++) {
      final gap = _stamps[i] - _stamps[i - 1];
      if (gap > worst) worst = gap;
    }
    if (mounted) {
      setState(() {
        _fps = _stamps.length;
        _worstMs = worst / 1000;
      });
    }
  }

  @override
  void dispose() {
    SchedulerBinding.instance.removeTimingsCallback(_onTimings);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => IgnorePointer(
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: C.glassThick,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: C.glassRim),
      ),
      child: Text('$_fps к/с · худший кадр ${_worstMs.toStringAsFixed(1)} мс', style: T.num.copyWith(color: C.text2)),
    ),
  );
}
