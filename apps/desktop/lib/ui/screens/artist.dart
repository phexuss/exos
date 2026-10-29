import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/format.dart';
import '../../core/models.dart';
import '../../core/services.dart' as services;
import '../../stores.dart';
import '../tokens.dart';
import '../widgets/cards.dart';
import '../widgets/controls.dart';
import '../widgets/cover.dart';
import '../widgets/loader.dart';
import '../widgets/motion.dart';
import '../widgets/tracks.dart';
import 'page.dart';

/// The name set large over the portrait, popular tracks, then the discography.
class ArtistScreen extends StatefulWidget {
  const ArtistScreen({super.key, required this.id});
  final String id;
  @override
  State<ArtistScreen> createState() => _ArtistScreenState();
}

class _ArtistScreenState extends State<ArtistScreen> {
  bool _all = false;

  @override
  Widget build(BuildContext context) => Loader<(ArtistCard, List<Track>, List<AlbumCard>)>(
    load: () async {
      final r = await (
        services.getArtist(widget.id),
        services.getArtistTracks(widget.id),
        services.getArtistAlbums(widget.id).catchError((_) => <AlbumCard>[]),
      ).wait;
      return r;
    },
    deps: [widget.id],
    errorTitle: 'Артист не загрузился',
    loading: const PageScroll(children: [Skeleton(rows: 10)]),
    builder: (context, data) {
      final (a, tracks, albums) = data;
      final shown = _all ? tracks : tracks.take(5).toList();
      return PageScroll(
        children: [
          LayoutBuilder(
            builder: (context, c) {
              final pic = (c.maxWidth * 0.22).clamp(140.0, 220.0);
              return Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Rise(
                    child: DecoratedBox(
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: C.shadow3, blurRadius: 40, offset: Offset(0, 18))],
                      ),
                      child: Cover(url: a.pictureUrl, seed: a.name, size: pic, round: true, label: a.name),
                    ),
                  ),
                  const SizedBox(width: 28),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Rise(
                          index: 1,
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Text(a.name, style: T.display.copyWith(fontSize: 64, fontWeight: FontWeight.w900, letterSpacing: -2)),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          [
                            if (a.fans != null) '${formatCount(a.fans!)} слушателей на Deezer',
                            if (a.albumsCount != null) '${a.albumsCount} ${plural(a.albumsCount!, ['альбом', 'альбома', 'альбомов'])}',
                          ].join(' · '),
                          style: T.sub,
                        ),
                        const SizedBox(height: 16),
                        Btn(
                          'Слушать',
                          kind: BtnKind.primary,
                          icon: LucideIcons.play,
                          onTap: tracks.isEmpty ? null : () => player.playQueue(tracks),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(height: 40),
          const Text('Популярное', style: T.h2),
          const SizedBox(height: 12),
          if (tracks.isEmpty) const EmptyState(title: 'Треков нет') else TrackList(tracks: shown, numbered: true),
          if (tracks.length > 5)
            Padding(
              padding: const EdgeInsets.only(top: 8, left: 8),
              child: Btn(_all ? 'Свернуть' : 'Ещё ${tracks.length - 5}', small: true, onTap: () => setState(() => _all = !_all)),
            ),
          if (albums.isNotEmpty) ...[
            const SizedBox(height: 44),
            const Text('Дискография', style: T.h2),
            const SizedBox(height: 18),
            CardGrid(children: [for (final al in albums) AlbumTile(album: al)]),
          ],
        ],
      );
    },
  );
}
