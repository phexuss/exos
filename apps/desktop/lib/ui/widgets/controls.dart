import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../look.dart';
import '../tokens.dart';
import 'glass.dart';
import 'motion.dart';

/// A round icon button that springs on hover and press.
class IconBtn extends StatelessWidget {
  const IconBtn(this.icon, {super.key, required this.onTap, this.tooltip, this.size = 18, this.box = 34, this.active = false, this.color});
  final IconData icon;
  final VoidCallback? onTap;
  final String? tooltip;
  final double size;
  final double box;
  final bool active;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    final btn = Tappable(
      onTap: onTap,
      builder: (context, s) => Bouncy(
        state: s,
        hover: 1.08,
        child: AnimatedContainer(
          duration: D.fast,
          width: box,
          height: box,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: s.hovered && onTap != null ? C.fill3 : const Color(0x00000000),
            border: s.focused ? Border.all(color: C.glassRimStrong) : null,
          ),
          child: Icon(icon, size: size, color: onTap == null ? C.text4 : (active ? accent : color ?? (s.hovered ? C.text : C.text2))),
        ),
      ),
    );
    return tooltip == null ? btn : Tooltip(message: tooltip!, waitDuration: const Duration(milliseconds: 600), child: btn);
  }
}

enum BtnKind { primary, plain, danger }

/// A pill button. Primary takes the artwork's accent.
class Btn extends StatelessWidget {
  const Btn(this.label, {super.key, required this.onTap, this.icon, this.kind = BtnKind.plain, this.small = false, this.busy = false});
  final String label;
  final IconData? icon;
  final VoidCallback? onTap;
  final BtnKind kind;
  final bool small;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    final enabled = onTap != null && !busy;
    final (bg, fg) = switch (kind) {
      BtnKind.primary => (accent, C.onAccent),
      BtnKind.plain => (C.fill3, C.text),
      BtnKind.danger => (C.fill2, C.danger),
    };
    return Tappable(
      onTap: enabled ? onTap : null,
      builder: (context, s) => Bouncy(
        state: s,
        hover: 1.02,
        press: 0.96,
        child: AnimatedOpacity(
          duration: D.fast,
          opacity: enabled ? 1 : 0.5,
          child: AnimatedContainer(
            duration: D.fast,
            height: small ? 32 : 40,
            padding: EdgeInsets.symmetric(horizontal: small ? 12 : 18),
            decoration: BoxDecoration(
              color: s.hovered && enabled ? Color.alphaBlend(C.fill2, bg) : bg,
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: s.focused ? C.glassRimStrong : const Color(0x00000000)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (busy)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Spinner(size: small ? 13 : 15, color: fg),
                  )
                else if (icon != null)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Icon(icon, size: small ? 14 : 16, color: fg),
                  ),
                Text(
                  label,
                  style: (small ? T.sub : T.body).copyWith(color: fg, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// The big round play button, with a ring that breathes while music plays.
class PlayButton extends StatefulWidget {
  const PlayButton({super.key, required this.playing, required this.loading, required this.onTap, this.size = 46});
  final bool playing;
  final bool loading;
  final VoidCallback? onTap;
  final double size;

  @override
  State<PlayButton> createState() => _PlayButtonState();
}

class _PlayButtonState extends State<PlayButton> with SingleTickerProviderStateMixin {
  late final AnimationController _breath = AnimationController(vsync: this, duration: const Duration(milliseconds: 2400));

  @override
  void initState() {
    super.initState();
    _sync();
  }

  @override
  void didUpdateWidget(PlayButton old) {
    super.didUpdateWidget(old);
    _sync();
  }

  void _sync() {
    if (widget.playing && !_breath.isAnimating) {
      _breath.repeat(reverse: true);
    } else if (!widget.playing && _breath.isAnimating) {
      _breath.animateTo(0, duration: D.mid);
    }
  }

  @override
  void dispose() {
    _breath.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    final size = widget.size;
    return Tappable(
      onTap: widget.onTap,
      builder: (context, s) => Bouncy(
        state: s,
        hover: widget.onTap == null ? 1 : 1.06,
        press: 0.9,
        child: AnimatedOpacity(
          duration: D.fast,
          opacity: widget.onTap == null ? 0.45 : 1,
          child: SizedBox.square(
            dimension: size + 16,
            child: Stack(
              alignment: Alignment.center,
              children: [
                if (!reduceMotion(context))
                  AnimatedBuilder(
                    animation: _breath,
                    builder: (context, _) {
                      final t = Curves.easeInOut.transform(_breath.value);
                      return Container(
                        width: size + 4 + 12 * t,
                        height: size + 4 + 12 * t,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: accent.withValues(alpha: 0.45 * (1 - t) * (widget.playing ? 1 : 0)), width: 1.5),
                        ),
                      );
                    },
                  ),
                AnimatedContainer(
                  duration: D.mid,
                  width: size,
                  height: size,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: accent,
                    boxShadow: [
                      BoxShadow(
                        color: accent.withValues(alpha: s.hovered ? 0.5 : 0.3),
                        blurRadius: s.hovered ? 24 : 16,
                      ),
                    ],
                  ),
                  child: widget.loading
                      ? Center(
                          child: Spinner(size: size * 0.4, color: C.onAccent),
                        )
                      : AnimatedSwitcher(
                          duration: D.fast,
                          transitionBuilder: (c, a) => ScaleTransition(
                            scale: a,
                            child: FadeTransition(opacity: a, child: c),
                          ),
                          child: Icon(
                            widget.playing ? LucideIcons.pause : LucideIcons.play,
                            key: ValueKey(widget.playing),
                            size: size * 0.5,
                            color: C.onAccent,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class Spinner extends StatefulWidget {
  const Spinner({super.key, this.size = 16, this.color = C.text2});
  final double size;
  final Color color;
  @override
  State<Spinner> createState() => _SpinnerState();
}

class _SpinnerState extends State<Spinner> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat();
  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => RotationTransition(
    turns: _c,
    child: SizedBox.square(
      dimension: widget.size,
      child: CustomPaint(painter: _ArcPainter(widget.color)),
    ),
  );
}

class _ArcPainter extends CustomPainter {
  _ArcPainter(this.color);
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width * 0.12;
    canvas.drawArc(
      (Offset.zero & size).deflate(w / 2),
      0,
      4.4,
      false,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = w
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_ArcPainter old) => old.color != color;
}

/// A switch whose knob springs across.
class Toggle extends StatelessWidget {
  const Toggle({super.key, required this.on, required this.onChanged});
  final bool on;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    return Tappable(
      onTap: () => onChanged(!on),
      builder: (context, s) => AnimatedContainer(
        duration: D.mid,
        curve: easeOut,
        width: 44,
        height: 26,
        padding: const EdgeInsets.all(3),
        decoration: BoxDecoration(
          color: on ? accent : C.fill5,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(color: s.focused ? C.glassRimStrong : const Color(0x00000000)),
        ),
        child: AnimatedAlign(
          duration: D.slow,
          curve: spring,
          alignment: on ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            width: 20,
            height: 20,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: C.text,
              boxShadow: [BoxShadow(color: C.shadow1, blurRadius: 4)],
            ),
          ),
        ),
      ),
    );
  }
}

/// Two to four options with a pill that glides to the chosen one.
class Segmented<V> extends StatelessWidget {
  const Segmented({super.key, required this.value, required this.options, required this.onChanged, this.width = 96});
  final V value;
  final List<(V, String)> options;
  final ValueChanged<V> onChanged;
  final double width;

  @override
  Widget build(BuildContext context) {
    final i = options.indexWhere((o) => o.$1 == value);
    return Container(
      height: 36,
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: C.fill2,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: C.divider),
      ),
      child: Stack(
        children: [
          AnimatedPositioned(
            duration: D.slow,
            curve: spring,
            left: i < 0 ? 0 : i * width,
            top: 0,
            bottom: 0,
            width: width,
            child: AnimatedOpacity(
              duration: D.fast,
              opacity: i < 0 ? 0 : 1,
              child: DecoratedBox(
                decoration: BoxDecoration(color: C.fill5, borderRadius: BorderRadius.circular(99)),
              ),
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final (v, label) in options)
                Tappable(
                  onTap: () => onChanged(v),
                  builder: (context, s) => SizedBox(
                    width: width,
                    child: Center(
                      child: AnimatedDefaultTextStyle(
                        duration: D.fast,
                        style: T.sub.copyWith(color: v == value ? C.text : (s.hovered ? C.text2 : C.text3), fontWeight: FontWeight.w500),
                        child: Text(label),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

/// A thin bar you can click or drag, which thickens under the pointer.
class LineSlider extends StatefulWidget {
  const LineSlider({super.key, required this.value, required this.onChanged, this.onEnd, this.height = 4, this.semantic});
  final double value;
  final ValueChanged<double> onChanged;
  final ValueChanged<double>? onEnd;
  final double height;
  final String? semantic;

  @override
  State<LineSlider> createState() => _LineSliderState();
}

class _LineSliderState extends State<LineSlider> {
  bool _hover = false;
  double? _drag;

  double _at(Offset local, double width) => (local.dx / width).clamp(0.0, 1.0);

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    final v = _drag ?? widget.value.clamp(0.0, 1.0);
    final active = _hover || _drag != null;
    return LayoutBuilder(
      builder: (context, c) => MouseRegion(
        cursor: SystemMouseCursors.click,
        onEnter: (_) => setState(() => _hover = true),
        onExit: (_) => setState(() => _hover = false),
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapUp: (d) {
            final x = _at(d.localPosition, c.maxWidth);
            widget.onChanged(x);
            widget.onEnd?.call(x);
          },
          onHorizontalDragStart: (d) => setState(() => _drag = _at(d.localPosition, c.maxWidth)),
          onHorizontalDragUpdate: (d) {
            final x = _at(d.localPosition, c.maxWidth);
            setState(() => _drag = x);
            widget.onChanged(x);
          },
          onHorizontalDragEnd: (_) {
            final x = _drag;
            setState(() => _drag = null);
            if (x != null) widget.onEnd?.call(x);
          },
          child: Semantics(
            slider: true,
            label: widget.semantic,
            value: '${(v * 100).round()}%',
            child: SizedBox(
              height: 18,
              width: c.maxWidth,
              child: CustomPaint(painter: _LinePainter(v, active, accent, widget.height)),
            ),
          ),
        ),
      ),
    );
  }
}

class _LinePainter extends CustomPainter {
  _LinePainter(this.v, this.active, this.accent, this.h);
  final double v;
  final bool active;
  final Color accent;
  final double h;

  @override
  void paint(Canvas canvas, Size size) {
    final th = active ? h + 2 : h;
    final y = size.height / 2;
    final r = Radius.circular(th / 2);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(0, y - th / 2, size.width, th), r), Paint()..color = C.fill5);
    final w = size.width * v;
    if (w > 0) {
      canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(0, y - th / 2, w, th), r), Paint()..color = active ? accent : C.textStrong);
    }
    if (active) {
      canvas.drawCircle(Offset(w, y), 6.5, Paint()..color = C.shadow2);
      canvas.drawCircle(Offset(w, y), 6, Paint()..color = C.text);
    }
  }

  @override
  bool shouldRepaint(_LinePainter o) => o.v != v || o.active != active || o.accent != accent || o.h != h;
}

/// Three bars dancing next to whatever is playing now.
class Eq extends StatefulWidget {
  const Eq({super.key, required this.playing, this.size = 14});
  final bool playing;
  final double size;
  @override
  State<Eq> createState() => _EqState();
}

class _EqState extends State<Eq> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100));

  @override
  void initState() {
    super.initState();
    if (widget.playing) _c.repeat();
  }

  @override
  void didUpdateWidget(Eq old) {
    super.didUpdateWidget(old);
    if (widget.playing && !_c.isAnimating) _c.repeat();
    if (!widget.playing) _c.stop();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    return SizedBox.square(
      dimension: widget.size,
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, _) => CustomPaint(painter: _EqPainter(_c.value, accent)),
      ),
    );
  }
}

class _EqPainter extends CustomPainter {
  _EqPainter(this.t, this.color);
  final double t;
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width / 5;
    final p = Paint()..color = color;
    const phases = [0.0, 0.35, 0.7];
    for (var i = 0; i < 3; i++) {
      final x = (t + phases[i]) % 1;
      final h = size.height * (0.3 + 0.7 * (0.5 - 0.5 * math.cos(x * 2 * math.pi)));
      canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(i * 2 * w, size.height - h, w, h), Radius.circular(w / 2)), p);
    }
  }

  @override
  bool shouldRepaint(_EqPainter o) => o.t != t || o.color != color;
}

/// A text field on glass, used for search and login.
class Field extends StatelessWidget {
  const Field({
    super.key,
    required this.controller,
    this.hint,
    this.icon,
    this.focusNode,
    this.autofocus = false,
    this.obscure = false,
    this.onChanged,
    this.onSubmitted,
    this.big = false,
  });
  final TextEditingController controller;
  final String? hint;
  final IconData? icon;
  final FocusNode? focusNode;
  final bool autofocus;
  final bool obscure;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final bool big;

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    final style = big ? T.h2.copyWith(fontWeight: FontWeight.w500) : T.body;
    return TextField(
      controller: controller,
      focusNode: focusNode,
      autofocus: autofocus,
      obscureText: obscure,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      style: style,
      cursorColor: accent,
      decoration: InputDecoration(
        isDense: true,
        hintText: hint,
        hintStyle: style.copyWith(color: C.text4),
        prefixIcon: icon == null ? null : Icon(icon, size: big ? 22 : 17, color: C.text3),
        filled: true,
        fillColor: C.fill2,
        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: big ? 18 : 13),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(R.md),
          borderSide: const BorderSide(color: C.divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(R.md),
          borderSide: const BorderSide(color: C.divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(R.md),
          borderSide: BorderSide(color: accent.withValues(alpha: 0.6)),
        ),
      ),
    );
  }
}

/// A floating glass menu at a point, closed by clicking anywhere else.
class MenuItem {
  const MenuItem(this.label, this.icon, this.onTap, {this.danger = false});
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool danger;
}

void showMenuAt(BuildContext context, Offset at, List<MenuItem> items) {
  Navigator.of(context).push(_MenuRoute(at, items));
}

class _MenuRoute extends PopupRoute<void> {
  _MenuRoute(this.at, this.items);
  final Offset at;
  final List<MenuItem> items;

  @override
  Color? get barrierColor => null;
  @override
  bool get barrierDismissible => true;
  @override
  String? get barrierLabel => 'Закрыть меню';
  @override
  Duration get transitionDuration => D.fast;

  @override
  Widget buildPage(BuildContext context, Animation<double> animation, Animation<double> secondaryAnimation) {
    const width = 236.0;
    final h = items.length * 38.0 + 12;
    final screen = MediaQuery.sizeOf(context);
    final left = (at.dx + width > screen.width - 8) ? at.dx - width : at.dx;
    final top = (at.dy + h > screen.height - 8) ? at.dy - h : at.dy;
    return Stack(
      children: [
        Positioned(
          left: left.clamp(8, screen.width - width - 8),
          top: top.clamp(8, screen.height - h - 8),
          width: width,
          child: FadeTransition(
            opacity: animation,
            child: ScaleTransition(
              scale: Tween(begin: 0.94, end: 1.0).animate(CurvedAnimation(parent: animation, curve: easeOut)),
              alignment: Alignment.topLeft,
              child: Glass(
                radius: R.md,
                tint: C.glassMenu,
                padding: const EdgeInsets.all(6),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    for (final it in items)
                      Tappable(
                        onTap: () {
                          Navigator.of(context).pop();
                          it.onTap();
                        },
                        builder: (context, s) => Spot(
                          state: s,
                          radius: R.sm,
                          child: SizedBox(
                            height: 38,
                            child: Row(
                              children: [
                                const SizedBox(width: 10),
                                Icon(it.icon, size: 16, color: it.danger ? C.danger : C.text2),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    it.label,
                                    style: T.body.copyWith(color: it.danger ? C.danger : C.text),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// An empty or failed state: what happened, in plain words.
class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.title, this.text, this.icon, this.action});
  final String title;
  final String? text;
  final IconData? icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
    child: Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) Icon(icon, size: 30, color: C.text4),
            if (icon != null) const SizedBox(height: 14),
            Text(title, style: T.title, textAlign: TextAlign.center),
            if (text != null) const SizedBox(height: 6),
            if (text != null) Text(text!, style: T.sub, textAlign: TextAlign.center),
            if (action != null) const SizedBox(height: 18),
            ?action,
          ],
        ),
      ),
    ),
  );
}

/// A row that pulses softly where content is about to appear.
class Skeleton extends StatefulWidget {
  const Skeleton({super.key, this.rows = 6, this.height = 52});
  final int rows;
  final double height;
  @override
  State<Skeleton> createState() => _SkeletonState();
}

class _SkeletonState extends State<Skeleton> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: Tween(begin: 0.5, end: 1.0).animate(_c),
    child: Column(
      children: [
        for (var i = 0; i < widget.rows; i++)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                Container(
                  width: widget.height - 8,
                  height: widget.height - 8,
                  decoration: BoxDecoration(color: C.fill2, borderRadius: BorderRadius.circular(R.sm)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      FractionallySizedBox(
                        widthFactor: 0.5 + (i % 3) * 0.12,
                        child: Container(
                          height: 12,
                          decoration: BoxDecoration(color: C.fill3, borderRadius: BorderRadius.circular(6)),
                        ),
                      ),
                      const SizedBox(height: 8),
                      FractionallySizedBox(
                        widthFactor: 0.3,
                        child: Container(
                          height: 10,
                          decoration: BoxDecoration(color: C.fill2, borderRadius: BorderRadius.circular(5)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
      ],
    ),
  );
}
