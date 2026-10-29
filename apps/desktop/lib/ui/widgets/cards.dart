import 'dart:math' as math;

import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/format.dart';
import '../../core/models.dart';
import '../../state/nav.dart';
import '../../stores.dart';
import '../look.dart';
import '../tokens.dart';
import 'cover.dart';
import 'motion.dart';

/// Leans toward the pointer in 3D, like a card held up to the light.
class Tilt extends StatelessWidget {
  const Tilt({super.key, required this.state, required this.size, required this.child, this.amount = 0.18});
  final TapState state;
  final Size size;
  final Widget child;
  final double amount;

  @override
  Widget build(BuildContext context) {
    final p = state.pointer;
    var dx = 0.0, dy = 0.0;
    if (state.hovered && p != null && size.width > 0 && !reduceMotion(context)) {
      dx = (p.dx / size.width - 0.5).clamp(-0.5, 0.5);
      dy = (p.dy / size.height - 0.5).clamp(-0.5, 0.5);
    }
    return TweenAnimationBuilder<Offset>(
      tween: Tween(end: Offset(dx, dy)),
      duration: D.mid,
      curve: easeOut,
      builder: (context, o, child) => Transform(
        alignment: Alignment.center,
        transform: Matrix4.identity()
          ..setEntry(3, 2, 0.0012)
          ..rotateX(-o.dy * amount)
          ..rotateY(o.dx * amount),
        child: child,
      ),
      child: child,
    );
  }
}

/// Cards in as many columns as fit, never wider than the panel.
class CardGrid extends StatelessWidget {
  const CardGrid({super.key, required this.children, this.min = 168, this.gap = 18, this.maxRows});
  final List<Widget> children;
  final double min;
  final double gap;
  final int? maxRows;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, c) {
      final cols = math.max(2, ((c.maxWidth + gap) / (min + gap)).floor());
      final w = (c.maxWidth - gap * (cols - 1)) / cols;
      final shown = maxRows == null ? children : children.take(cols * maxRows!).toList();
      return Wrap(
        spacing: gap,
        runSpacing: gap + 4,
        children: [
          for (var i = 0; i < shown.length; i++)
            SizedBox(
              width: w,
              child: Rise(index: i, child: shown[i]),
            ),
        ],
      );
    },
  );
}

class AlbumTile extends StatelessWidget {
  const AlbumTile({super.key, required this.album});
  final AlbumCard album;

  @override
  Widget build(BuildContext context) {
    final sub = [album.year, album.artistName].whereType<String>().where((s) => s.isNotEmpty).join(' · ');
    return Tappable(
      onTap: () => nav.go(AlbumRoute(album.id)),
      builder: (context, s) => LayoutBuilder(
        builder: (context, c) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Tilt(
              state: s,
              size: Size.square(c.maxWidth),
              child: AnimatedContainer(
                duration: D.mid,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(R.md),
                  boxShadow: [
                    BoxShadow(
                      color: s.hovered ? C.shadow3 : C.shadow1,
                      blurRadius: s.hovered ? 28 : 12,
                      offset: Offset(0, s.hovered ? 14 : 6),
                    ),
                  ],
                ),
                child: Cover(url: album.coverUrl, seed: album.title, label: album.title),
              ),
            ),
            const SizedBox(height: 10),
            Text(album.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: T.title),
            Text(sub.isEmpty ? 'Альбом' : sub, maxLines: 1, overflow: TextOverflow.ellipsis, style: T.sub),
          ],
        ),
      ),
    );
  }
}

class ArtistTile extends StatelessWidget {
  const ArtistTile({super.key, required this.artist});
  final ArtistCard artist;

  @override
  Widget build(BuildContext context) => Tappable(
    onTap: () => nav.go(ArtistRoute(artist.id)),
    builder: (context, s) => Column(
      children: [
        Bouncy(
          state: s,
          hover: 1.05,
          child: Cover(url: artist.pictureUrl, seed: artist.name, label: artist.name, round: true),
        ),
        const SizedBox(height: 10),
        Text(artist.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: T.title, textAlign: TextAlign.center),
        Text(artist.fans != null ? '${formatCount(artist.fans!)} слушателей' : 'Артист', style: T.sub, textAlign: TextAlign.center),
      ],
    ),
  );
}

/// A wide tile: cover, title, artist, and a play disc that slides in on hover.
class QuickTile extends StatelessWidget {
  const QuickTile({super.key, required this.track, required this.onPlay});
  final Track track;
  final VoidCallback onPlay;

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    return ListenableBuilder(
      listenable: player,
      builder: (context, _) {
        final current = player.current?.id == track.id;
        return Tappable(
          onTap: onPlay,
          builder: (context, s) => Spot(
            state: s,
            radius: R.md,
            base: C.fill2,
            selected: current,
            child: SizedBox(
              height: 64,
              child: Row(
                children: [
                  Cover(url: track.coverUrl, seed: track.seed, size: 64, radius: R.md, label: track.title),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          track.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: T.title.copyWith(color: current ? accent : C.text),
                        ),
                        Text(track.artist.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: T.sub),
                      ],
                    ),
                  ),
                  AnimatedSlide(
                    duration: D.mid,
                    curve: spring,
                    offset: Offset(s.hovered ? 0 : 0.4, 0),
                    child: AnimatedOpacity(
                      duration: D.fast,
                      opacity: s.hovered ? 1 : 0,
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(shape: BoxShape.circle, color: accent),
                        child: const Icon(LucideIcons.play, size: 15, color: C.onAccent),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
