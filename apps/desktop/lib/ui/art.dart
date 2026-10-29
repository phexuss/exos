import 'dart:math';
import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';

import '../core/format.dart';

/// Abstract cover art for the prototype's example catalogue, generated from a
/// seed so every album looks distinct without shipping real artwork. Real
/// covers come from Deezer and SoundCloud.
class GenArt {
  GenArt(String seed) {
    final r = Random(seedHash(seed));
    hue = r.nextInt(360).toDouble();
    hue2 = (hue + 30 + r.nextInt(140)) % 360;
    hue3 = (hue + 180 + r.nextInt(60)) % 360;
    style = r.nextInt(4);
    _shapeSeed = r.nextInt(1 << 30);
  }

  late final double hue, hue2, hue3;
  late final int style;
  late final int _shapeSeed;

  static Color hsl(double h, double s, double l, [double a = 1]) => HSLColor.fromAHSL(a, h, s, l).toColor();

  /// Colours the ambient light and accent take from this cover.
  List<Color> get palette => [hsl(hue, .75, .55), hsl(hue2, .7, .5), hsl(hue3, .65, .45), hsl(hue, .55, .2)];

  void paint(Canvas canvas, Size size) {
    final s = size.width;
    final r = Random(_shapeSeed);
    canvas.drawRect(
      Offset.zero & size,
      Paint()..shader = ui.Gradient.linear(Offset.zero, Offset(s, s), [hsl(hue, .55, .26), hsl(hue3, .5, .12)]),
    );
    switch (style) {
      case 0: // orbs
        final blur = Paint()..maskFilter = MaskFilter.blur(BlurStyle.normal, s * 0.06);
        for (var i = 0; i < 5; i++) {
          final h = [hue, hue2, hue3][i % 3];
          canvas.drawCircle(
            Offset(r.nextDouble() * s, r.nextDouble() * s),
            s * (0.18 + r.nextDouble() * 0.35),
            blur..color = hsl(h, .75, .55, .85),
          );
        }
      case 1: // bands
        final n = 5 + r.nextInt(5);
        for (var i = 0; i < n; i++) {
          canvas.save();
          canvas.translate(s / 2, s / 2);
          canvas.rotate((-12 + r.nextDouble() * 24) * pi / 180);
          canvas.translate(-s / 2, -s / 2);
          canvas.drawRect(
            Rect.fromLTWH(-20, i / n * s, s + 40, s / n + 2),
            Paint()..color = hsl(i.isOdd ? hue2 : hue, .65, .30 + i / n * .4),
          );
          canvas.restore();
        }
        canvas.drawCircle(
          Offset(s * (0.3 + r.nextDouble() * 0.4), s * (0.3 + r.nextDouble() * 0.4)),
          s * 0.18,
          Paint()..color = hsl(hue3, .8, .62),
        );
      case 2: // sun
        canvas.drawRect(Rect.fromLTWH(0, 0, s, s * 0.62), Paint()..color = hsl(hue, .6, .22));
        canvas.drawCircle(Offset(s / 2, s * 0.62), s * 0.3, Paint()..color = hsl(hue2, .85, .6));
        for (var i = 0; i < 6; i++) {
          canvas.drawRect(Rect.fromLTWH(0, s * 0.62 + i * s * 0.065, s, s * 0.03), Paint()..color = hsl(hue3, .55, .18));
        }
      default: // grid
        const n = 6;
        for (var i = 0; i < n; i++) {
          for (var j = 0; j < n; j++) {
            if (r.nextDouble() < 0.45) continue;
            final h = r.nextDouble() < 0.5 ? hue : hue2;
            final cell = Rect.fromLTWH(i * s / n, j * s / n, s / n, s / n);
            final round = r.nextDouble() < 0.5;
            final paint = Paint()..color = hsl(h, .7, .35 + r.nextDouble() * .35);
            canvas.drawRRect(RRect.fromRectAndRadius(cell, Radius.circular(round ? s / n / 2 : 0)), paint);
          }
        }
    }
  }
}

class GenArtPainter extends CustomPainter {
  GenArtPainter(this.seed) : art = GenArt(seed);
  final String seed;
  final GenArt art;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.clipRect(Offset.zero & size);
    art.paint(canvas, size);
  }

  @override
  bool shouldRepaint(GenArtPainter old) => old.seed != seed;
}
