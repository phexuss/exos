import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../player/player.dart';
import '../stores.dart';
import 'lyrics.dart';
import 'player_dock.dart';
import 'look.dart';
import 'titlebar.dart';
import 'tokens.dart';
import 'widgets/ambient.dart';
import 'widgets/controls.dart';
import 'widgets/cover.dart';
import 'widgets/motion.dart';

/// The whole window for one song: the cover leaning toward the pointer under
/// a sliding sheen, the ambient light at full strength, lyrics beside it.
class NowPlayingRoute extends PageRouteBuilder<void> {
  NowPlayingRoute()
    : super(
        opaque: true,
        transitionDuration: D.slow,
        reverseTransitionDuration: D.mid,
        pageBuilder: (context, a, b) => const NowPlaying(),
        transitionsBuilder: (context, a, b, child) => FadeTransition(
          opacity: CurvedAnimation(parent: a, curve: easeOut),
          child: child,
        ),
      );
}

class NowPlaying extends StatefulWidget {
  const NowPlaying({super.key});
  @override
  State<NowPlaying> createState() => _NowPlayingState();
}

class _NowPlayingState extends State<NowPlaying> {
  Offset _tilt = Offset.zero;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onHover: (e) {
        final size = MediaQuery.sizeOf(context);
        setState(() => _tilt = Offset(e.position.dx / size.width - 0.5, e.position.dy / size.height - 0.5));
      },
      onExit: (_) => setState(() => _tilt = Offset.zero),
      child: ListenableBuilder(
        listenable: Listenable.merge([player, look]),
        builder: (context, _) {
          final t = player.current;
          return Stack(
            fit: StackFit.expand,
            children: [
              AmbientBackground(palette: look.palette, playing: player.status == PlayStatus.playing),
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [C.veilLight, C.veilMid]),
                ),
              ),
              Column(
                children: [
                  SizedBox(
                    height: 48,
                    child: DragArea(
                      child: Row(
                        children: [
                          SizedBox(width: isMac ? 84 : 16),
                          IconBtn(LucideIcons.chevronDown, tooltip: 'Свернуть (Esc)', onTap: () => player.setNowPlaying(false)),
                          const Spacer(),
                          if (isDesktop && !isMac) const WindowButtons(),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: t == null
                        ? const SizedBox.shrink()
                        : LayoutBuilder(
                            builder: (context, c) {
                              final wide = c.maxWidth > 980;
                              final art = (wide ? c.maxWidth * 0.32 : c.maxWidth * 0.5).clamp(220.0, c.maxHeight - 260).clamp(160.0, 520.0);
                              final left = Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _Art(size: art, tilt: _tilt, playing: player.status == PlayStatus.playing),
                                  const SizedBox(height: 32),
                                  SizedBox(
                                    width: art,
                                    child: AnimatedSwitcher(
                                      duration: D.mid,
                                      layoutBuilder: (cur, prev) => Stack(alignment: Alignment.topLeft, children: [...prev, ?cur]),
                                      child: Column(
                                        key: ValueKey(t.id),
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(t.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: T.h1),
                                          const SizedBox(height: 4),
                                          Text(
                                            t.artist.name,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: T.title.copyWith(color: C.text2, fontWeight: FontWeight.w400),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 20),
                                  SizedBox(width: art, child: const SeekBar(big: true)),
                                  const SizedBox(height: 8),
                                  SizedBox(width: art, child: const _BigTransport()),
                                ],
                              );
                              return Padding(
                                padding: EdgeInsets.fromLTRB(wide ? 72 : 32, 0, wide ? 48 : 32, 32),
                                child: wide
                                    ? Row(
                                        children: [
                                          left,
                                          const SizedBox(width: 72),
                                          const Expanded(child: LyricsView(big: true)),
                                        ],
                                      )
                                    : Center(child: left),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Art extends StatelessWidget {
  const _Art({required this.size, required this.tilt, required this.playing});
  final double size;
  final Offset tilt;
  final bool playing;

  @override
  Widget build(BuildContext context) {
    final t = player.current!;
    final still = reduceMotion(context);
    return TweenAnimationBuilder<Offset>(
      tween: Tween(end: still ? Offset.zero : tilt),
      duration: D.slow,
      curve: easeOut,
      builder: (context, o, child) => AnimatedScale(
        scale: playing ? 1 : 0.92,
        duration: D.lazy,
        curve: spring,
        child: Transform(
          alignment: Alignment.center,
          transform: Matrix4.identity()
            ..setEntry(3, 2, 0.0009)
            ..rotateX(-o.dy * 0.22)
            ..rotateY(o.dx * 0.22),
          child: Stack(
            children: [
              child!,
              Positioned.fill(
                child: IgnorePointer(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(R.lg),
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment(-1.4 + o.dx * 2, -1.4 + o.dy * 2),
                          end: Alignment(1.4 + o.dx * 2, 1.4 + o.dy * 2),
                          colors: const [Color(0x00FFFFFF), Color(0x24FFFFFF), Color(0x00FFFFFF)],
                          stops: const [0.3, 0.5, 0.7],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      child: SizedBox.square(
        dimension: size,
        child: Hero(
          tag: coverHeroTag,
          flightShuttleBuilder: coverFlight,
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(R.lg),
              boxShadow: [
                BoxShadow(color: C.shadow3, blurRadius: 60, offset: const Offset(0, 28)),
                BoxShadow(color: Accent.of(context).withValues(alpha: 0.18), blurRadius: 90),
              ],
            ),
            child: Cover(url: t.coverUrl, seed: t.seed, size: size, radius: R.lg, label: t.title),
          ),
        ),
      ),
    );
  }
}

class _BigTransport extends StatelessWidget {
  const _BigTransport();

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      IconBtn(LucideIcons.shuffle, tooltip: 'Перемешать', active: player.shuffle, onTap: player.toggleShuffle),
      IconBtn(LucideIcons.skipBack, tooltip: 'Назад', size: 22, box: 44, onTap: player.prev),
      PlayButton(
        size: 60,
        playing: player.status == PlayStatus.playing,
        loading: player.status == PlayStatus.loading,
        onTap: player.toggle,
      ),
      IconBtn(LucideIcons.skipForward, tooltip: 'Дальше', size: 22, box: 44, onTap: player.next),
      IconBtn(
        player.repeat == Repeat.one ? LucideIcons.repeat1 : LucideIcons.repeat,
        tooltip: 'Повтор',
        active: player.repeat != Repeat.off,
        onTap: player.cycleRepeat,
      ),
    ],
  );
}
