import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/format.dart';
import '../../core/models.dart';
import '../../core/services.dart' as services;
import '../../player/player.dart';
import '../../stores.dart';
import '../look.dart';
import '../tokens.dart';
import '../widgets/cards.dart';
import '../widgets/controls.dart';
import '../widgets/cover.dart';
import '../widgets/loader.dart';
import '../widgets/motion.dart';
import '../widgets/tracks.dart';
import 'page.dart';

String _greeting() {
  final h = DateTime.now().hour;
  if (h < 5) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _chart = services.getChart();
  final _recent = services.getCloudRecent().catchError((_) => <Track>[]);
  late final Future<Track?> _seed = _recent.then((r) async {
    if (r.isNotEmpty) return r.first;
    try {
      final c = await _chart;
      return c.tracks.isEmpty ? null : c.tracks.first;
    } catch (_) {
      return null;
    }
  });

  @override
  Widget build(BuildContext context) {
    final name = auth.user?.name;
    return PageScroll(
      children: [
        Rise(child: Text('${_greeting()}${name == null ? '' : ', $name'}', style: T.display)),
        const SizedBox(height: 22),
        FutureBuilder<List<Track>>(
          future: _recent,
          builder: (context, snap) {
            final list = snap.data ?? const <Track>[];
            if (list.isEmpty) return const SizedBox.shrink();
            return LayoutBuilder(
              builder: (context, c) {
                final cols = c.maxWidth > 900 ? 3 : 2;
                final w = (c.maxWidth - 12 * (cols - 1)) / cols;
                final shown = list.take(cols * 2).toList();
                return Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    for (var i = 0; i < shown.length; i++)
                      SizedBox(
                        width: w,
                        child: Rise(
                          index: i,
                          child: QuickTile(track: shown[i], onPlay: () => player.playQueue(list, i)),
                        ),
                      ),
                  ],
                );
              },
            );
          },
        ),
        const SizedBox(height: 40),
        Loader<Chart>(
          load: () => _chart,
          errorTitle: 'Чарт не загрузился',
          loading: const Skeleton(rows: 8),
          builder: (context, chart) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LayoutBuilder(
                builder: (context, c) {
                  final rank = _RankList(tracks: chart.tracks.take(10).toList());
                  final aside = _Similar(seed: _seed);
                  if (c.maxWidth < 900) {
                    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [rank, const SizedBox(height: 40), aside]);
                  }
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(flex: 3, child: rank),
                      const SizedBox(width: 40),
                      Expanded(flex: 2, child: aside),
                    ],
                  );
                },
              ),
              if (chart.albums.isNotEmpty) ...[
                const SizedBox(height: 48),
                const Text('Альбомы недели', style: T.h2),
                const SizedBox(height: 18),
                CardGrid(children: [for (final a in chart.albums.take(12)) AlbumTile(album: a)]),
              ],
              if (chart.artists.isNotEmpty) ...[
                const SizedBox(height: 48),
                const Text('Артисты в чарте', style: T.h2),
                const SizedBox(height: 18),
                CardGrid(min: 132, maxRows: 1, children: [for (final a in chart.artists) ArtistTile(artist: a)]),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

/// The chart as a ranked list: the position is the point, so it gets the type.
class _RankList extends StatelessWidget {
  const _RankList({required this.tracks});
  final List<Track> tracks;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          const Expanded(child: Text('Чарт Deezer', style: T.h2)),
          Btn('Слушать подряд', small: true, icon: LucideIcons.play, onTap: tracks.isEmpty ? null : () => player.playQueue(tracks)),
        ],
      ),
      const SizedBox(height: 14),
      for (var i = 0; i < tracks.length; i++)
        Rise(
          index: i,
          child: _RankRow(tracks: tracks, i: i),
        ),
    ],
  );
}

class _RankRow extends StatelessWidget {
  const _RankRow({required this.tracks, required this.i});
  final List<Track> tracks;
  final int i;

  @override
  Widget build(BuildContext context) {
    final t = tracks[i];
    return ListenableBuilder(
      listenable: player,
      builder: (context, _) {
        final accent = Accent.of(context);
        final current = player.current?.id == t.id;
        return Tappable(
          onTap: () => player.playQueue(tracks, i),
          onSecondaryTapUp: (d) => showTrackMenu(context, d.globalPosition, t, play: () => player.playQueue(tracks, i)),
          builder: (context, s) => Spot(
            state: s,
            selected: current,
            child: SizedBox(
              height: 64,
              child: Row(
                children: [
                  SizedBox(
                    width: 56,
                    child: Center(
                      child: current
                          ? Eq(playing: player.status == PlayStatus.playing, size: 18)
                          : Text(
                              '${i + 1}',
                              style: TextStyle(
                                fontFamily: T.family,
                                fontSize: 30,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -1,
                                fontFeatures: const [FontFeature.tabularFigures()],
                                color: s.hovered ? accent : (i < 3 ? C.text2 : C.text4),
                              ),
                            ),
                    ),
                  ),
                  Bouncy(
                    state: s,
                    hover: 1.06,
                    child: Cover(url: t.coverUrl, seed: t.seed, size: 48, radius: R.sm, label: t.title),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: T.title.copyWith(color: current ? accent : C.text),
                        ),
                        Text(t.artist.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: T.sub),
                      ],
                    ),
                  ),
                  Text(formatTime(t.durationSec), style: T.num),
                  const SizedBox(width: 6),
                  DownloadButton(track: t),
                  const SizedBox(width: 6),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _Similar extends StatelessWidget {
  const _Similar({required this.seed});
  final Future<Track?> seed;

  @override
  Widget build(BuildContext context) => FutureBuilder<Track?>(
    future: seed,
    builder: (context, s) {
      final t = s.data;
      if (t == null) return const SizedBox.shrink();
      return Loader<List<Track>>(
        load: () => services.getSimilar(t).catchError((_) => <Track>[]),
        deps: [t.id],
        loading: const Skeleton(rows: 6, height: 64),
        builder: (context, list) {
          if (list.isEmpty) return const SizedBox.shrink();
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Похоже на «${t.title}»', style: T.h2, maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 4),
              const Text('Подборка Last.fm по последнему, что ты слушал.', style: T.sub),
              const SizedBox(height: 16),
              for (var i = 0; i < list.length && i < 7; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Rise(
                    index: i,
                    child: QuickTile(track: list[i], onPlay: () => player.playQueue(list, i)),
                  ),
                ),
            ],
          );
        },
      );
    },
  );
}
