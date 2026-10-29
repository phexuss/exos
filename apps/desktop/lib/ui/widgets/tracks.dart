import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/format.dart';
import '../../core/models.dart';
import '../../engine/engine.dart';
import '../../player/player.dart';
import '../../state/nav.dart';
import '../../stores.dart';
import '../look.dart';
import '../tokens.dart';
import 'controls.dart';
import 'cover.dart';
import 'motion.dart';

/// Play, queue, download and go-to actions for a track, at the pointer.
void showTrackMenu(BuildContext context, Offset at, Track t, {VoidCallback? play}) {
  final local = library.get(t.id);
  showMenuAt(context, at, [
    MenuItem('Слушать', LucideIcons.play, play ?? () => player.playTrack(t)),
    MenuItem('Следующим', LucideIcons.listStart, () => player.playNext(t)),
    MenuItem('В конец очереди', LucideIcons.listEnd, () => player.addToQueue(t)),
    if (local == null) MenuItem('Скачать', LucideIcons.arrowDownToLine, () => library.download(t)),
    if (local != null) MenuItem('Показать в папке', LucideIcons.folderOpen, () => engine.reveal(local.filePath)),
    if (t.albumId != null) MenuItem('К альбому', LucideIcons.disc3, () => nav.go(AlbumRoute(t.albumId!))),
    if (t.source == Source.deezer && t.artist.id.isNotEmpty)
      MenuItem('К артисту', LucideIcons.user, () => nav.go(ArtistRoute(t.artist.id))),
    if (local != null) MenuItem('Удалить с диска', LucideIcons.trash2, () => library.remove(t.id), danger: true),
  ]);
}

/// Download state for a track: arrow, live progress ring, or a tick.
class DownloadButton extends StatelessWidget {
  const DownloadButton({super.key, required this.track});
  final Track track;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: library,
    builder: (context, _) {
      final accent = Accent.of(context);
      if (library.isDownloaded(track.id)) {
        return SizedBox(width: 34, child: Icon(LucideIcons.circleCheck, size: 17, color: accent));
      }
      final job = library.jobs[track.id];
      if (job != null && (job.running || job.stage.name == 'queued')) {
        return Tooltip(
          message: 'Отменить',
          child: Tappable(
            onTap: () => library.cancel(track.id),
            builder: (context, s) => SizedBox.square(
              dimension: 34,
              child: Center(
                child: SizedBox.square(
                  dimension: 18,
                  child: TweenAnimationBuilder<double>(
                    tween: Tween(end: job.progress),
                    duration: D.mid,
                    builder: (context, v, _) => CustomPaint(painter: _RingPainter(v, accent, s.hovered)),
                  ),
                ),
              ),
            ),
          ),
        );
      }
      return IconBtn(LucideIcons.arrowDownToLine, tooltip: 'Скачать', size: 17, onTap: () => library.download(track));
    },
  );
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.v, this.color, this.hover);
  final double v;
  final Color color;
  final bool hover;
  @override
  void paint(Canvas canvas, Size size) {
    final r = Offset.zero & size;
    final p = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawArc(r.deflate(1), 0, 6.283, false, p..color = C.fill5);
    canvas.drawArc(r.deflate(1), -1.5708, 6.283 * v.clamp(0.02, 1), false, p..color = color);
    if (hover) {
      final c = size.center(Offset.zero);
      final x = Paint()
        ..color = C.text
        ..strokeWidth = 1.6
        ..strokeCap = StrokeCap.round;
      canvas.drawLine(c + const Offset(-3, -3), c + const Offset(3, 3), x);
      canvas.drawLine(c + const Offset(3, -3), c + const Offset(-3, 3), x);
    }
  }

  @override
  bool shouldRepaint(_RingPainter o) => o.v != v || o.color != color || o.hover != hover;
}

/// One track: number or equaliser, cover, title and artist, album, length,
/// download. Double-click plays, right-click opens the menu.
class TrackRow extends StatelessWidget {
  const TrackRow({
    super.key,
    required this.track,
    required this.onPlay,
    this.number,
    this.showCover = true,
    this.showAlbum = true,
    this.trailing,
  });
  final Track track;
  final VoidCallback onPlay;
  final int? number;
  final bool showCover;
  final bool showAlbum;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: player,
      builder: (context, _) {
        final accent = Accent.of(context);
        final isCurrent = player.current?.id == track.id;
        final playing = isCurrent && player.status == PlayStatus.playing;
        return Tappable(
          onTap: onPlay,
          onSecondaryTapUp: (d) => showTrackMenu(context, d.globalPosition, track, play: onPlay),
          builder: (context, s) => Spot(
            state: s,
            selected: isCurrent,
            child: LayoutBuilder(
              builder: (context, c) {
                final wide = c.maxWidth > 640;
                return SizedBox(
                  height: 56,
                  child: Row(
                    children: [
                      if (number != null)
                        SizedBox(
                          width: 40,
                          child: Center(
                            child: isCurrent
                                ? Eq(playing: playing)
                                : s.hovered
                                ? const Icon(LucideIcons.play, size: 15, color: C.text)
                                : Text('$number', style: T.num),
                          ),
                        )
                      else
                        const SizedBox(width: 8),
                      if (showCover) ...[
                        Stack(
                          children: [
                            Cover(url: track.coverUrl, seed: track.seed, size: 40, radius: R.sm, label: track.title),
                            if (number == null && (s.hovered || isCurrent))
                              Positioned.fill(
                                child: DecoratedBox(
                                  decoration: BoxDecoration(color: C.veilMid, borderRadius: BorderRadius.circular(R.sm)),
                                  child: Center(
                                    child: isCurrent ? Eq(playing: playing) : const Icon(LucideIcons.play, size: 16, color: C.text),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(width: 14),
                      ],
                      Expanded(
                        flex: 5,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              track.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: T.title.copyWith(color: isCurrent ? accent : C.text),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                if (track.source == Source.soundcloud)
                                  const Padding(
                                    padding: EdgeInsets.only(right: 6),
                                    child: Icon(LucideIcons.cloud, size: 13, color: C.soundcloudText),
                                  ),
                                Flexible(
                                  child: Text(track.artist.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: T.sub),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      if (showAlbum && wide && track.album != null)
                        Expanded(
                          flex: 3,
                          child: Padding(
                            padding: const EdgeInsets.only(left: 16),
                            child: Text(track.album!, maxLines: 1, overflow: TextOverflow.ellipsis, style: T.sub),
                          ),
                        ),
                      const SizedBox(width: 12),
                      Text(formatTime(track.durationSec), style: T.num),
                      const SizedBox(width: 6),
                      trailing ?? DownloadButton(track: track),
                      const SizedBox(width: 6),
                    ],
                  ),
                );
              },
            ),
          ),
        );
      },
    );
  }
}

/// Tracks that rise into place one after another.
class TrackList extends StatelessWidget {
  const TrackList({super.key, required this.tracks, this.numbered = false, this.showCover = true, this.showAlbum = true});
  final List<Track> tracks;
  final bool numbered;
  final bool showCover;
  final bool showAlbum;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      for (var i = 0; i < tracks.length; i++)
        Rise(
          index: i,
          child: TrackRow(
            track: tracks[i],
            number: numbered ? i + 1 : null,
            showCover: showCover,
            showAlbum: showAlbum,
            onPlay: () => player.playQueue(tracks, i),
          ),
        ),
    ],
  );
}
