import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';

import '../../stores.dart';
import '../tokens.dart';

/// A pane of glass over the moving background: tint, a rim, a soft highlight
/// along the top edge, and (when live blur is on) a frosted backdrop.
class Glass extends StatelessWidget {
  const Glass({super.key, required this.child, this.radius = R.lg, this.tint = C.glassTint, this.blur = 28, this.padding});
  final Widget child;
  final double radius;
  final Color tint;
  final double blur;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final shape = BorderRadius.circular(radius);
    Widget body = DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: shape,
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: const Alignment(0, -0.6),
          colors: [Color.alphaBlend(C.glassHighlight, tint), tint],
        ),
        border: Border.all(color: C.glassRim, width: 1),
      ),
      child: padding == null ? child : Padding(padding: padding!, child: child),
    );
    return ListenableBuilder(
      listenable: settings,
      builder: (context, _) => ClipRRect(
        borderRadius: shape,
        child: settings.liveBlur && blur > 0
            ? BackdropFilter(
                filter: ui.ImageFilter.blur(sigmaX: blur, sigmaY: blur),
                child: body,
              )
            : body,
      ),
    );
  }
}
