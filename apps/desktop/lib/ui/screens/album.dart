import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/format.dart';
import '../../core/models.dart';
import '../../core/services.dart' as services;
import '../../state/nav.dart';
import '../../stores.dart';
import '../tokens.dart';
import '../widgets/cards.dart';
import '../widgets/controls.dart';
import '../widgets/cover.dart';
import '../widgets/loader.dart';
import '../widgets/motion.dart';
import '../widgets/tracks.dart';
import 'page.dart';

/// The cover stays on the left like a sleeve; the tracklist runs beside it.
class AlbumScreen extends StatelessWidget {
  const AlbumScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) => Loader<AlbumDetail>(
    load: () => services.getAlbum(id),
    deps: [id],
    errorTitle: 'Альбом не загрузился',
    loading: const PageScroll(children: [Skeleton(rows: 10)]),
    builder: (context, a) => LayoutBuilder(
      builder: (context, c) {
        final wide = c.maxWidth > 860;
        final side = _Sleeve(album: a, size: wide ? (c.maxWidth * 0.3).clamp(240.0, 360.0) : 200);
        final list = a.tracks.isEmpty
            ? const EmptyState(
                title: 'В альбоме нет треков',
                text: 'Deezer не отдал список. Такое бывает с релизами, которые убрали из каталога.',
              )
            : TrackList(tracks: a.tracks, numbered: true, showCover: false, showAlbum: false);
        if (!wide) return PageScroll(children: [side, const SizedBox(height: 28), list]);
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(padding: const EdgeInsets.fromLTRB(36, 30, 0, 30), child: side),
            Expanded(
              child: PageScroll(padding: const EdgeInsets.fromLTRB(28, 30, 28, 40), children: [list]),
            ),
          ],
        );
      },
    ),
  );
}

class _Sleeve extends StatelessWidget {
  const _Sleeve({required this.album, required this.size});
  final AlbumDetail album;
  final double size;

  @override
  Widget build(BuildContext context) => ListenableBuilder(listenable: library, builder: (context, _) => _build(context));

  Widget _build(BuildContext context) {
    final a = album.card;
    final total = album.tracks.fold<int>(0, (s, t) => s + t.durationSec);
    final missing = album.tracks.where((t) => !library.isDownloaded(t.id)).toList();
    return SizedBox(
      width: size,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Tappable(
            onTap: album.tracks.isEmpty ? null : () => player.playQueue(album.tracks),
            builder: (context, s) => Tilt(
              state: s,
              size: Size.square(size),
              amount: 0.14,
              child: DecoratedBox(
                decoration: const BoxDecoration(
                  boxShadow: [BoxShadow(color: C.shadow3, blurRadius: 40, offset: Offset(0, 20))],
                ),
                child: Cover(url: a.coverUrl, seed: a.title, size: size, radius: R.lg, label: a.title),
              ),
            ),
          ),
          const SizedBox(height: 22),
          Rise(child: Text(a.title, style: T.h1)),
          const SizedBox(height: 6),
          Tappable(
            onTap: album.artistId.isEmpty ? null : () => nav.go(ArtistRoute(album.artistId)),
            builder: (context, s) => Text(a.artistName ?? '', style: T.title.copyWith(color: s.hovered ? C.text : C.text2)),
          ),
          const SizedBox(height: 4),
          Text([a.year, tracksLabel(album.tracks.length), formatTotal(total)].whereType<String>().join(' · '), style: T.sub),
          const SizedBox(height: 20),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              Btn(
                'Слушать',
                kind: BtnKind.primary,
                icon: LucideIcons.play,
                onTap: album.tracks.isEmpty ? null : () => player.playQueue(album.tracks),
              ),
              Btn(
                missing.isEmpty ? 'Скачан' : 'Скачать',
                icon: missing.isEmpty ? LucideIcons.circleCheck : LucideIcons.arrowDownToLine,
                onTap: missing.isEmpty ? null : () => library.downloadMany(missing),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
