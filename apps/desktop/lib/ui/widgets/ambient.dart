import 'dart:ui' as ui;

import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';

import '../palette.dart';
import '../tokens.dart';

/// The moving light behind the whole window, drawn by shaders/ambient.frag.
/// Colours glide to each new cover's palette; the drift quickens while music
/// plays and settles when it stops.
class AmbientBackground extends StatefulWidget {
  const AmbientBackground({super.key, required this.palette, required this.playing});
  final CoverPalette palette;
  final bool playing;

  @override
  State<AmbientBackground> createState() => _AmbientBackgroundState();
}

class _AmbientBackgroundState extends State<AmbientBackground> with SingleTickerProviderStateMixin {
  static Future<ui.FragmentProgram>? _program;
  ui.FragmentShader? _shader;
  late final Ticker _ticker;
  final _time = ValueNotifier(0.0);
  Duration _last = Duration.zero;
  double _clock = 0;
  double _energy = 0;
  List<Color> _from = CoverPalette.idle.light;
  List<Color> _to = CoverPalette.idle.light;
  double _mix = 1;

  @override
  void initState() {
    super.initState();
    _to = widget.palette.light;
    _from = _to;
    (_program ??= ui.FragmentProgram.fromAsset('shaders/ambient.frag')).then((p) {
      if (mounted) setState(() => _shader = p.fragmentShader());
    });
    _ticker = createTicker(_tick)..start();
  }

  void _tick(Duration now) {
    final dt = (now - _last).inMicroseconds / 1e6;
    _last = now;
    if (dt <= 0 || dt > 0.25) return;
    final target = widget.playing ? 1.0 : 0.0;
    _energy += (target - _energy) * (1 - _expDecay(dt, 1.2));
    _clock += dt * (0.6 + 0.8 * _energy);
    if (_mix < 1) _mix = (_mix + dt / 1.1).clamp(0, 1);
    _time.value = _clock;
  }

  static double _expDecay(double dt, double rate) => 1 / (1 + dt * rate * 3);

  @override
  void didUpdateWidget(AmbientBackground old) {
    super.didUpdateWidget(old);
    if (old.palette != widget.palette) {
      _from = _current();
      _to = widget.palette.light;
      _mix = 0;
    }
  }

  List<Color> _current() {
    final t = easeOut.transform(_mix);
    return [for (var i = 0; i < 4; i++) Color.lerp(_from[i], _to[i], t)!];
  }

  @override
  void dispose() {
    _ticker.dispose();
    _time.dispose();
    _shader?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final shader = _shader;
    if (shader == null) return const ColoredBox(color: C.bg);
    return RepaintBoundary(
      child: CustomPaint(size: Size.infinite, painter: _AmbientPainter(shader, _time, this)),
    );
  }
}

class _AmbientPainter extends CustomPainter {
  _AmbientPainter(this.shader, this.time, this.state) : super(repaint: time);
  final ui.FragmentShader shader;
  final ValueNotifier<double> time;
  final _AmbientBackgroundState state;

  @override
  void paint(Canvas canvas, Size size) {
    final colors = state._current();
    var i = 0;
    void f(double v) => shader.setFloat(i++, v);
    void c(Color x) {
      f(x.r);
      f(x.g);
      f(x.b);
      f(1);
    }

    f(size.width);
    f(size.height);
    f(time.value);
    f(state._energy);
    for (final x in colors) {
      c(x);
    }
    c(C.bg);
    canvas.drawRect(Offset.zero & size, Paint()..shader = shader);
  }

  @override
  bool shouldRepaint(_AmbientPainter old) => true;
}
