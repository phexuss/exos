import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/format.dart';
import '../player/player.dart';
import '../stores.dart';
import 'lyrics.dart';
import 'look.dart';
import 'tokens.dart';
import 'widgets/controls.dart';
import 'widgets/cover.dart';
import 'widgets/glass.dart';
import 'widgets/motion.dart';
import 'widgets/tracks.dart';

/// Lyrics or the queue, beside the page rather than over it.
class SidePanel extends StatelessWidget {
  const SidePanel({super.key, required this.panel});
  final Panel panel;

  @override
  Widget build(BuildContext context) => Glass(
    padding: const EdgeInsets.fromLTRB(18, 14, 10, 0),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Segmented<Panel>(
              value: panel,
              width: 88,
              options: const [(Panel.lyrics, 'Текст'), (Panel.queue, 'Очередь')],
              onChanged: (p) => player.togglePanel(p),
            ),
            const Spacer(),
            IconBtn(LucideIcons.x, tooltip: 'Скрыть', size: 16, onTap: () => player.togglePanel(panel)),
          ],
        ),
        Expanded(
          child: AnimatedSwitcher(
            duration: D.mid,
            switchInCurve: easeOut,
            transitionBuilder: (c, a) => FadeTransition(opacity: a, child: c),
            child: panel == Panel.lyrics ? const LyricsView(key: ValueKey('lyrics')) : const _Queue(key: ValueKey('queue')),
          ),
        ),
      ],
    ),
  );
}

class _Queue extends StatelessWidget {
  const _Queue({super.key});

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: player,
    builder: (context, _) {
      final q = player.queue;
      if (q.isEmpty) {
        return const EmptyState(
          icon: LucideIcons.listMusic,
          title: 'Очередь пуста',
          text: 'Включи альбом или чарт, и следующие треки появятся здесь.',
        );
      }
      final rest = q.length - player.index - 1;
      final left = q.skip(player.index).fold<int>(0, (s, t) => s + t.durationSec);
      return ListView.builder(
        padding: const EdgeInsets.only(top: 16, bottom: 16, right: 8),
        itemCount: q.length + 1,
        itemBuilder: (context, i) {
          if (i == 0) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 10, left: 4),
              child: Text(rest > 0 ? 'Дальше ${tracksLabel(rest)} · ещё ${formatTotal(left)}' : 'Это последний трек', style: T.sub),
            );
          }
          final at = i - 1;
          final t = q[at];
          final current = at == player.index;
          final played = at < player.index;
          return _QueueRow(key: ValueKey('${t.id}#$at'), index: at, current: current, played: played);
        },
      );
    },
  );
}

class _QueueRow extends StatelessWidget {
  const _QueueRow({super.key, required this.index, required this.current, required this.played});
  final int index;
  final bool current;
  final bool played;

  @override
  Widget build(BuildContext context) {
    final t = player.queue[index];
    final accent = Accent.of(context);
    return Tappable(
      onTap: () => player.playAt(index),
      onSecondaryTapUp: (d) => showTrackMenu(context, d.globalPosition, t, play: () => player.playAt(index)),
      builder: (context, s) => Spot(
        state: s,
        radius: R.sm,
        selected: current,
        child: Opacity(
          opacity: played ? 0.5 : 1,
          child: SizedBox(
            height: 50,
            child: Row(
              children: [
                const SizedBox(width: 6),
                Cover(url: t.coverUrl, seed: t.seed, size: 38, radius: 6, label: t.title),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: T.body.copyWith(fontWeight: FontWeight.w500, color: current ? accent : C.text),
                      ),
                      Text(t.artist.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: T.small),
                    ],
                  ),
                ),
                if (current)
                  Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: Eq(playing: player.status == PlayStatus.playing),
                  )
                else if (s.hovered)
                  IconBtn(LucideIcons.x, tooltip: 'Убрать', size: 14, box: 28, onTap: () => player.removeFromQueue(index))
                else
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Text(formatTime(t.durationSec), style: T.num),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
