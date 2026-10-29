import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/format.dart';
import '../../core/models.dart';
import '../../engine/engine.dart';
import '../../state/nav.dart';
import '../../stores.dart';
import '../tokens.dart';
import '../widgets/controls.dart';
import '../widgets/cover.dart';
import '../widgets/motion.dart';
import '../widgets/tracks.dart';
import 'page.dart';

enum _Sort { recent, artist, title }

/// Music on this computer: a fan of the newest covers, then everything.
class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});
  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  final _filter = TextEditingController();
  _Sort _sort = _Sort.recent;

  @override
  void dispose() {
    _filter.dispose();
    super.dispose();
  }

  List<Track> _visible() {
    final needle = _filter.text.trim().toLowerCase();
    final list = [...library.tracks];
    switch (_sort) {
      case _Sort.recent:
        list.sort((a, b) => b.downloadedAt.compareTo(a.downloadedAt));
      case _Sort.artist:
        list.sort((a, b) => a.track.artist.name.toLowerCase().compareTo(b.track.artist.name.toLowerCase()));
      case _Sort.title:
        list.sort((a, b) => a.track.title.toLowerCase().compareTo(b.track.title.toLowerCase()));
    }
    return [
      for (final l in list)
        if (needle.isEmpty ||
            l.track.title.toLowerCase().contains(needle) ||
            l.track.artist.name.toLowerCase().contains(needle) ||
            (l.track.album?.toLowerCase().contains(needle) ?? false))
          l.track,
    ];
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: Listenable.merge([library, _filter]),
    builder: (context, _) {
      if (!library.loaded) return const PageScroll(children: [Skeleton(rows: 8)]);
      final all = library.tracks;
      if (all.isEmpty) {
        return PageScroll(
          children: [
            const Text('На компьютере', style: T.h1),
            EmptyState(
              icon: LucideIcons.hardDriveDownload,
              title: 'Пока пусто',
              text: 'Скачанные треки играют без сети и лежат обычными файлами в ${library.musicDir}.',
              action: Btn('Найти музыку', kind: BtnKind.primary, icon: LucideIcons.search, onTap: () => nav.go(const SearchRoute())),
            ),
          ],
        );
      }
      final list = _visible();
      final total = all.fold<int>(0, (s, l) => s + l.track.durationSec);
      final newest = ([...all]..sort((a, b) => b.downloadedAt.compareTo(a.downloadedAt))).take(4).toList();
      return PageScroll(
        children: [
          LayoutBuilder(
            builder: (context, c) {
              final info = Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('На компьютере', style: T.display),
                  const SizedBox(height: 6),
                  Text('${tracksLabel(all.length)} · ${formatTotal(total)} · играют без сети', style: T.sub),
                  const SizedBox(height: 18),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      Btn('Слушать всё', kind: BtnKind.primary, icon: LucideIcons.play, onTap: () => player.playQueue(list)),
                      Btn(
                        'Вперемешку',
                        icon: LucideIcons.shuffle,
                        onTap: () {
                          if (!player.shuffle) player.toggleShuffle();
                          player.playQueue(list);
                        },
                      ),
                      Btn('Открыть папку', icon: LucideIcons.folderOpen, onTap: () => engine.openFolder(library.musicDir)),
                    ],
                  ),
                ],
              );
              if (c.maxWidth < 720) return info;
              return Row(
                children: [
                  _Fan(tracks: newest.map((l) => l.track).toList()),
                  const SizedBox(width: 36),
                  Expanded(child: info),
                ],
              );
            },
          ),
          const SizedBox(height: 34),
          Row(
            children: [
              Expanded(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 360),
                  child: Field(controller: _filter, hint: 'Фильтр', icon: LucideIcons.listFilter),
                ),
              ),
              const SizedBox(width: 16),
              Segmented<_Sort>(
                value: _sort,
                width: 92,
                options: const [(_Sort.recent, 'Недавние'), (_Sort.artist, 'Артист'), (_Sort.title, 'Название')],
                onChanged: (v) => setState(() => _sort = v),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (list.isEmpty)
            EmptyState(title: 'Ничего не подходит', text: 'По «${_filter.text.trim()}» в медиатеке ничего нет.')
          else
            TrackList(key: ValueKey(_sort), tracks: list),
        ],
      );
    },
  );
}

/// The newest covers fanned out like records pulled from a shelf.
class _Fan extends StatelessWidget {
  const _Fan({required this.tracks});
  final List<Track> tracks;

  @override
  Widget build(BuildContext context) => Tappable(
    onTap: tracks.isEmpty ? null : () => player.playQueue(tracks),
    builder: (context, s) => SizedBox(
      width: 230,
      height: 170,
      child: Stack(
        children: [
          for (var i = tracks.length - 1; i >= 0; i--)
            AnimatedPositioned(
              duration: D.slow,
              curve: spring,
              left: i * (s.hovered ? 30.0 : 20.0),
              top: i * 4.0,
              child: AnimatedRotation(
                duration: D.slow,
                curve: spring,
                turns: (i - 1.5) * (s.hovered ? 0.018 : 0.01),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(R.md),
                    boxShadow: const [BoxShadow(color: C.shadow2, blurRadius: 18, offset: Offset(0, 8))],
                  ),
                  child: Cover(url: tracks[i].coverUrl, seed: tracks[i].seed, size: 150, radius: R.md, label: tracks[i].title),
                ),
              ),
            ),
        ],
      ),
    ),
  );
}
