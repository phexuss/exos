import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/format.dart';
import '../core/models.dart';
import '../player/player.dart';
import '../state/nav.dart';
import '../stores.dart';
import 'clock.dart';
import 'tokens.dart';
import 'widgets/controls.dart';
import 'widgets/cover.dart';
import 'widgets/glass.dart';
import 'widgets/motion.dart';
import 'widgets/tracks.dart';

const coverHeroTag = 'np-cover';

/// Cover flight between the dock and Now Playing, rounding its corners as it grows.
Widget coverFlight(BuildContext flightContext, Animation<double> a, HeroFlightDirection dir, BuildContext from, BuildContext to) {
  final t = player.current;
  return AnimatedBuilder(
    animation: a,
    builder: (context, _) {
      final v = easeOut.transform(a.value);
      return Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: C.shadow3.withValues(alpha: 0.5 * v),
              blurRadius: 60 * v,
              offset: Offset(0, 24 * v),
            ),
          ],
        ),
        child: Cover(url: t?.coverUrl, seed: t?.seed ?? '', radius: R.sm + (R.lg - R.sm) * v, label: t?.title),
      );
    },
  );
}

/// The floating player along the bottom of the window.
class PlayerDock extends StatelessWidget {
  const PlayerDock({super.key});

  @override
  Widget build(BuildContext context) => Glass(
    radius: R.lg,
    tint: C.glassThick,
    padding: const EdgeInsets.fromLTRB(12, 10, 16, 10),
    child: SizedBox(
      height: 64,
      child: LayoutBuilder(
        builder: (context, c) {
          final narrow = c.maxWidth < 860;
          return Row(
            children: [
              Expanded(flex: narrow ? 4 : 3, child: const _NowCard()),
              Expanded(flex: 5, child: const _Transport()),
              if (!narrow) const Expanded(flex: 3, child: _Extras()) else const _Extras(compact: true),
            ],
          );
        },
      ),
    ),
  );
}

class _NowCard extends StatelessWidget {
  const _NowCard();

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: player,
    builder: (context, _) {
      final t = player.current;
      if (t == null) {
        return Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(color: C.fill2, borderRadius: BorderRadius.circular(R.sm)),
              child: const Icon(LucideIcons.music, size: 20, color: C.text4),
            ),
            const SizedBox(width: 14),
            const Expanded(child: Text('Ничего не играет', style: T.sub)),
          ],
        );
      }
      return Tappable(
        onTap: () => player.setNowPlaying(true),
        onSecondaryTapUp: (d) => showTrackMenu(context, d.globalPosition, t),
        builder: (context, s) => Row(
          children: [
            Bouncy(
              state: s,
              hover: 1.06,
              child: SizedBox.square(
                dimension: 56,
                child: Hero(
                  tag: coverHeroTag,
                  flightShuttleBuilder: coverFlight,
                  child: Cover(url: t.coverUrl, seed: t.seed, size: 56, radius: R.sm, label: t.title),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: AnimatedSwitcher(
                duration: D.mid,
                switchInCurve: easeOut,
                transitionBuilder: (c, a) => FadeTransition(
                  opacity: a,
                  child: SlideTransition(
                    position: Tween(begin: const Offset(0, 0.25), end: Offset.zero).animate(a),
                    child: c,
                  ),
                ),
                layoutBuilder: (cur, prev) => Stack(alignment: Alignment.centerLeft, children: [...prev, ?cur]),
                child: Column(
                  key: ValueKey(t.id),
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(t.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: T.title),
                    const SizedBox(height: 2),
                    _ArtistLink(track: t),
                    if (player.note != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          player.note!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: T.small.copyWith(color: C.warning),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    },
  );
}

class _ArtistLink extends StatelessWidget {
  const _ArtistLink({required this.track});
  final Track track;

  @override
  Widget build(BuildContext context) {
    final can = track.source == Source.deezer && track.artist.id.isNotEmpty;
    return Tappable(
      onTap: can ? () => nav.go(ArtistRoute(track.artist.id)) : null,
      focusable: false,
      builder: (context, s) => Text(
        track.artist.name,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: T.sub.copyWith(
          color: s.hovered && can ? C.text : C.text3,
          decoration: s.hovered && can ? TextDecoration.underline : null,
          decorationColor: C.text3,
        ),
      ),
    );
  }
}

class _Transport extends StatelessWidget {
  const _Transport();

  @override
  Widget build(BuildContext context) => Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      ListenableBuilder(
        listenable: player,
        builder: (context, _) {
          final has = player.current != null;
          return Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconBtn(LucideIcons.shuffle, tooltip: 'Перемешать', size: 16, active: player.shuffle, onTap: player.toggleShuffle),
              const SizedBox(width: 6),
              IconBtn(LucideIcons.skipBack, tooltip: 'Назад', onTap: has ? player.prev : null),
              PlayButton(
                size: 40,
                playing: player.status == PlayStatus.playing,
                loading: player.status == PlayStatus.loading,
                onTap: has ? player.toggle : null,
              ),
              IconBtn(LucideIcons.skipForward, tooltip: 'Дальше', onTap: has ? player.next : null),
              const SizedBox(width: 6),
              IconBtn(
                player.repeat == Repeat.one ? LucideIcons.repeat1 : LucideIcons.repeat,
                tooltip: switch (player.repeat) {
                  Repeat.off => 'Повтор выключен',
                  Repeat.all => 'Повтор очереди',
                  Repeat.one => 'Повтор трека',
                },
                size: 16,
                active: player.repeat != Repeat.off,
                onTap: player.cycleRepeat,
              ),
            ],
          );
        },
      ),
      const SeekBar(),
    ],
  );
}

/// Elapsed, the bar, and the length; follows the frame clock while playing.
class SeekBar extends StatefulWidget {
  const SeekBar({super.key, this.big = false});
  final bool big;
  @override
  State<SeekBar> createState() => _SeekBarState();
}

class _SeekBarState extends State<SeekBar> {
  double? _drag;

  @override
  Widget build(BuildContext context) => ValueListenableBuilder<Duration>(
    valueListenable: player.duration,
    builder: (context, d, _) {
      final total = d.inMilliseconds / 1000;
      final fallback = (player.current?.durationSec ?? 0).toDouble();
      final len = total > 0 ? total : fallback;
      return ValueListenableBuilder<double>(
        valueListenable: playClock,
        builder: (context, t, _) {
          final at = _drag != null ? _drag! * len : t;
          return Row(
            children: [
              SizedBox(
                width: 44,
                child: Text(formatTime(at), style: T.num, textAlign: TextAlign.right),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: LineSlider(
                  semantic: 'Позиция',
                  height: widget.big ? 5 : 4,
                  value: len > 0 ? at / len : 0,
                  onChanged: (v) => setState(() => _drag = v),
                  onEnd: (v) {
                    setState(() => _drag = null);
                    if (len > 0) player.seek(Duration(milliseconds: (v * len * 1000).round()));
                  },
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(width: 44, child: Text(formatTime(len), style: T.num)),
            ],
          );
        },
      );
    },
  );
}

class _Extras extends StatelessWidget {
  const _Extras({this.compact = false});
  final bool compact;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: Listenable.merge([player, settings]),
    builder: (context, _) {
      final v = settings.volume;
      return Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          IconBtn(
            LucideIcons.micVocal,
            tooltip: 'Текст (L)',
            size: 17,
            active: player.panel == Panel.lyrics,
            onTap: () => player.togglePanel(Panel.lyrics),
          ),
          IconBtn(
            LucideIcons.listMusic,
            tooltip: 'Очередь (Q)',
            size: 17,
            active: player.panel == Panel.queue,
            onTap: () => player.togglePanel(Panel.queue),
          ),
          if (!compact) ...[
            const SizedBox(width: 6),
            IconBtn(
              v == 0 ? LucideIcons.volumeX : (v < 0.5 ? LucideIcons.volume1 : LucideIcons.volume2),
              tooltip: 'Громкость',
              size: 17,
              onTap: () => player.setVolume(v == 0 ? 0.6 : 0),
            ),
            SizedBox(
              width: 96,
              child: LineSlider(semantic: 'Громкость', value: v, onChanged: player.setVolume),
            ),
          ],
          const SizedBox(width: 4),
          IconBtn(
            LucideIcons.maximize2,
            tooltip: 'Сейчас играет (F)',
            size: 16,
            onTap: player.current == null ? null : () => player.setNowPlaying(true),
          ),
        ],
      );
    },
  );
}
