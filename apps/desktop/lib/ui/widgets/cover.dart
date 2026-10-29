import 'package:flutter/widgets.dart';

import '../art.dart';
import '../tokens.dart';

/// Artwork with a soft fade-in, a generated cover for the prototype's `gen:`
/// URLs, and initials on a gradient when there is no art at all.
class Cover extends StatelessWidget {
  const Cover({super.key, required this.url, required this.seed, this.size, this.radius = R.md, this.label, this.round = false});
  final String? url;
  final String seed;
  final double? size;
  final double radius;
  final String? label;
  final bool round;

  @override
  Widget build(BuildContext context) {
    final u = url;
    Widget art;
    if (u != null && u.startsWith('gen:')) {
      art = CustomPaint(painter: GenArtPainter(u.substring(4)));
    } else if (u != null && u.isNotEmpty) {
      art = Image.network(
        u,
        fit: BoxFit.cover,
        gaplessPlayback: true,
        filterQuality: FilterQuality.medium,
        frameBuilder: (context, child, frame, sync) =>
            sync ? child : AnimatedOpacity(opacity: frame == null ? 0 : 1, duration: D.mid, curve: easeOut, child: child),
        errorBuilder: (context, _, _) => _Placeholder(seed: seed, label: label),
      );
    } else {
      art = _Placeholder(seed: seed, label: label);
    }
    final shape = round ? BorderRadius.circular(9999) : BorderRadius.circular(radius);
    return SizedBox.square(
      dimension: size,
      child: AspectRatio(
        aspectRatio: 1,
        child: ClipRRect(
          borderRadius: shape,
          child: ColoredBox(
            color: C.surfaceElevated,
            child: SizedBox.expand(child: art),
          ),
        ),
      ),
    );
  }
}

class _Placeholder extends StatelessWidget {
  const _Placeholder({required this.seed, this.label});
  final String seed;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final a = GenArt(seed);
    final initials = (label ?? '')
        .trim()
        .split(RegExp(r'\s+'))
        .where((w) => w.isNotEmpty)
        .take(2)
        .map((w) => w.characters.first)
        .join()
        .toUpperCase();
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [GenArt.hsl(a.hue, .55, .42), GenArt.hsl(a.hue2, .6, .22)],
        ),
      ),
      child: LayoutBuilder(
        builder: (context, c) => Center(
          child: Text(
            initials,
            style: TextStyle(
              fontFamily: T.family,
              fontWeight: FontWeight.w900,
              fontSize: c.maxWidth * 0.32,
              letterSpacing: -1,
              color: C.textStrong,
            ),
          ),
        ),
      ),
    );
  }
}
