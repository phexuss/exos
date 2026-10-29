import 'package:flutter/widgets.dart';

/// Same palette as apps/mobile (constants/colors.ts, glass.ts) so both apps
/// read as one product. Every colour in the UI comes from here or from the
/// artwork.
abstract final class C {
  static const bg = Color(0xFF121212);
  static const surface = Color(0xFF1A1A1A);
  static const surfaceMuted = Color(0xFF212121);
  static const surfaceElevated = Color(0xFF282828);
  static const text = Color(0xFFFFFFFF);
  static const text2 = Color(0xB3FFFFFF);
  static const text3 = Color(0x73FFFFFF);
  static const text4 = Color(0x52FFFFFF);
  static const textStrong = Color(0xD9FFFFFF);
  static const border = Color(0x1FFFFFFF);
  static const divider = Color(0x14FFFFFF);
  static const hover = Color(0x0FFFFFFF);
  static const fill2 = Color(0x12FFFFFF);
  static const fill3 = Color(0x1AFFFFFF);
  static const fill5 = Color(0x29FFFFFF);
  static const fill6 = Color(0x3DFFFFFF);
  static const danger = Color(0xFFF87171);
  static const warning = Color(0xFFFBBF24);
  static const ok = Color(0xFF4ADE80);

  /// Accent follows the artwork; this is the brand fallback.
  static const accent = Color(0xFF818CF8);
  static const onAccent = Color(0xFF0D0D12);
  static const onLight = Color(0xFF111111);
  static const deezer = Color(0xFFA238FF);
  static const deezerText = Color(0xFFC78BFF);
  static const soundcloud = Color(0xFFFF5500);
  static const soundcloudText = Color(0xFFFF8A4C);

  static const glassTint = Color(0x6B1C1C20);
  static const glassThin = Color(0x3D1C1C20);
  static const glassThick = Color(0xA816161A);
  static const glassMenu = Color(0xDB1E1E22);
  static const glassRim = Color(0x24FFFFFF);
  static const glassRimStrong = Color(0x3DFFFFFF);
  static const glassHighlight = Color(0x1AFFFFFF);

  static const shadow1 = Color(0x40000000);
  static const shadow2 = Color(0x66000000);
  static const shadow3 = Color(0x80000000);
  static const veilLight = Color(0x330A0A0E);
  static const veilMid = Color(0x990A0A0E);
  static const veilDeep = Color(0xD90A0A0E);
  static const ambientIdleA = Color(0xFF3B3F8F);
  static const ambientIdleB = Color(0xFF6B2A14);
  static const winClose = Color(0xFFE81123);
}

abstract final class T {
  static const family = 'Jost';
  static const display = TextStyle(
    fontFamily: family,
    fontSize: 40,
    height: 1.05,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.8,
    color: C.text,
  );
  static const h1 = TextStyle(
    fontFamily: family,
    fontSize: 32,
    height: 1.1,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.6,
    color: C.text,
  );
  static const h2 = TextStyle(
    fontFamily: family,
    fontSize: 21,
    height: 1.2,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.2,
    color: C.text,
  );
  static const title = TextStyle(fontFamily: family, fontSize: 15, height: 1.3, fontWeight: FontWeight.w500, color: C.text);
  static const body = TextStyle(fontFamily: family, fontSize: 14, height: 1.4, fontWeight: FontWeight.w400, color: C.text);
  static const sub = TextStyle(fontFamily: family, fontSize: 13, height: 1.35, fontWeight: FontWeight.w400, color: C.text3);
  static const small = TextStyle(fontFamily: family, fontSize: 12, height: 1.3, fontWeight: FontWeight.w400, color: C.text3);
  static const label = TextStyle(fontFamily: family, fontSize: 11.5, fontWeight: FontWeight.w500, letterSpacing: 1.6, color: C.text3);
  static const num = TextStyle(fontFamily: family, fontSize: 12, fontFeatures: [FontFeature.tabularFigures()], color: C.text3);
}

abstract final class R {
  static const sm = 8.0;
  static const md = 14.0;
  static const lg = 24.0;
}

abstract final class D {
  static const fast = Duration(milliseconds: 160);
  static const mid = Duration(milliseconds: 320);
  static const slow = Duration(milliseconds: 520);
  static const lazy = Duration(milliseconds: 900);
  static const stagger = Duration(milliseconds: 40);
}

/// A spring that overshoots a touch and settles.
const Curve spring = Cubic(0.22, 1.2, 0.36, 1);
const Curve easeOut = Cubic(0.22, 1, 0.36, 1);
