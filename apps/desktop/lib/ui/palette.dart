import 'dart:async';
import 'dart:math';
import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';

import 'art.dart';
import 'tokens.dart';

/// Colours for the ambient light (four) and a readable accent, taken from a cover.
class CoverPalette {
  const CoverPalette(this.light, this.accent);
  final List<Color> light;
  final Color accent;

  static const idle = CoverPalette([C.ambientIdleA, C.ambientIdleB, Color(0xFF1F3A5F), Color(0xFF14141A)], C.accent);

  static final _cache = <String, CoverPalette>{};

  static Future<CoverPalette> of(String? url, String seed) async {
    final key = url ?? 'seed:$seed';
    final hit = _cache[key];
    if (hit != null) return hit;
    CoverPalette p;
    if (url == null || url.startsWith('gen:')) {
      p = _fromColors(GenArt(url?.substring(4) ?? seed).palette);
    } else {
      try {
        p = _fromColors(await _sample(url));
      } catch (_) {
        p = _fromColors(GenArt(seed).palette);
      }
    }
    return _cache[key] = p;
  }

  /// Draws the cover at 24×24 and buckets its pixels by hue, weighted by how vivid they are.
  static Future<List<Color>> _sample(String url) async {
    final provider = ResizeImage(NetworkImage(url), width: 24, height: 24);
    final done = Completer<ui.Image>();
    final stream = provider.resolve(ImageConfiguration.empty);
    late final ImageStreamListener l;
    l = ImageStreamListener(
      (info, _) {
        if (!done.isCompleted) done.complete(info.image);
        stream.removeListener(l);
      },
      onError: (e, _) {
        if (!done.isCompleted) done.completeError(e);
        stream.removeListener(l);
      },
    );
    stream.addListener(l);
    final img = await done.future.timeout(const Duration(seconds: 8));
    final data = await img.toByteData(format: ui.ImageByteFormat.rawRgba);
    if (data == null) throw StateError('no pixels');
    final buckets = List.generate(12, (_) => [0.0, 0.0, 0.0, 0.0]);
    var dark = [0.0, 0.0, 0.0, 0.0];
    for (var i = 0; i + 3 < data.lengthInBytes; i += 4) {
      final c = Color.fromARGB(255, data.getUint8(i), data.getUint8(i + 1), data.getUint8(i + 2));
      final h = HSLColor.fromColor(c);
      final w = h.saturation * (1 - (h.lightness - 0.5).abs() * 2) + 0.02;
      final b = buckets[(h.hue / 30).floor() % 12];
      b[0] += c.r * w;
      b[1] += c.g * w;
      b[2] += c.b * w;
      b[3] += w;
      dark = [dark[0] + c.r, dark[1] + c.g, dark[2] + c.b, dark[3] + 1];
    }
    buckets.sort((a, b) => b[3].compareTo(a[3]));
    Color avg(List<double> b) => Color.from(alpha: 1, red: b[0] / b[3], green: b[1] / b[3], blue: b[2] / b[3]);
    final picks = [for (final b in buckets.where((b) => b[3] > 0.05).take(3)) avg(b)];
    while (picks.length < 3) {
      picks.add(
        picks.isEmpty ? C.ambientIdleA : HSLColor.fromColor(picks.last).withHue((HSLColor.fromColor(picks.last).hue + 40) % 360).toColor(),
      );
    }
    return [...picks, avg(dark)];
  }

  static CoverPalette _fromColors(List<Color> c) {
    // Light should glow but stay behind the text: lift saturation, cap lightness.
    Color light(Color x, double l) {
      final h = HSLColor.fromColor(x);
      return h.withSaturation(min(1, h.saturation * 1.15 + 0.1)).withLightness(l).toColor();
    }

    final base = HSLColor.fromColor(c[3]);
    final lights = [light(c[0], .5), light(c[1], .44), light(c[2], .4), base.withLightness(min(base.lightness, .14)).toColor()];
    final vivid = [...c.take(3)]..sort((a, b) => HSLColor.fromColor(b).saturation.compareTo(HSLColor.fromColor(a).saturation));
    final a = HSLColor.fromColor(vivid.first);
    final accent = a.saturation < 0.18 ? C.accent : a.withSaturation(max(.55, a.saturation)).withLightness(.7).toColor();
    return CoverPalette(lights, accent);
  }
}
