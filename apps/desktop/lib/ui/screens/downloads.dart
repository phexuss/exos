import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../engine/engine.dart';
import '../../state/library.dart';
import '../../state/nav.dart';
import '../../stores.dart';
import '../look.dart';
import '../tokens.dart';
import '../widgets/controls.dart';
import '../widgets/cover.dart';
import '../widgets/motion.dart';
import 'page.dart';

/// What yt-dlp is fetching now, and what it finished or failed this session.
class DownloadsScreen extends StatelessWidget {
  const DownloadsScreen({super.key});

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: library,
    builder: (context, _) {
      final jobs = library.jobs.values.toList()..sort((a, b) => b.startedAt.compareTo(a.startedAt));
      final active = jobs.where((j) => j.running || j.stage == Stage.queued).toList();
      final done = jobs.where((j) => !(j.running || j.stage == Stage.queued)).toList();
      return PageScroll(
        children: [
          Row(
            children: [
              const Expanded(child: Text('Загрузки', style: T.h1)),
              if (done.isNotEmpty) Btn('Очистить готовые', small: true, onTap: library.clearFinished),
            ],
          ),
          const SizedBox(height: 6),
          Text('Файлы сохраняются в ${library.musicDir}', style: T.sub),
          const SizedBox(height: 26),
          if (jobs.isEmpty)
            EmptyState(
              icon: LucideIcons.arrowDownToLine,
              title: 'Ничего не качается',
              text: 'Нажми стрелку рядом с треком или скачай альбом целиком.',
              action: Btn('В медиатеку', icon: LucideIcons.library, onTap: () => nav.go(const LibraryRoute())),
            ),
          for (var i = 0; i < active.length; i++)
            Rise(
              index: i,
              child: _JobCard(job: active[i]),
            ),
          if (done.isNotEmpty) ...[
            const SizedBox(height: 26),
            const Text('Готово', style: T.h2),
            const SizedBox(height: 12),
            for (var i = 0; i < done.length; i++)
              Rise(
                index: i,
                child: _JobCard(job: done[i]),
              ),
          ],
        ],
      );
    },
  );
}

class _JobCard extends StatelessWidget {
  const _JobCard({required this.job});
  final DownloadJob job;

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    final t = job.track;
    final (label, color) = switch (job.stage) {
      Stage.queued => ('В очереди', C.text3),
      Stage.resolving => ('Ищу источник', C.text2),
      Stage.downloading => (
        '${(job.progress * 100).round()}%${job.speed == null ? '' : ' · ${job.speed}'}${job.eta == null ? '' : ' · осталось ${job.eta}'}',
        C.text2,
      ),
      Stage.converting => ('Конвертирую', C.text2),
      Stage.done => ('Скачано', C.ok),
      Stage.error => (job.error ?? 'Ошибка', C.danger),
    };
    final local = library.get(t.id);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: C.fill2,
          borderRadius: BorderRadius.circular(R.md),
          border: Border.all(color: C.divider),
        ),
        child: Row(
          children: [
            Cover(url: t.coverUrl, seed: t.seed, size: 52, radius: R.sm, label: t.title),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: T.title),
                  Text(t.artist.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: T.sub),
                  const SizedBox(height: 8),
                  if (job.running)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(99),
                      child: SizedBox(
                        height: 4,
                        child: TweenAnimationBuilder<double>(
                          tween: Tween(end: job.stage == Stage.downloading ? job.progress : (job.stage == Stage.converting ? 1 : 0.04)),
                          duration: D.mid,
                          curve: easeOut,
                          builder: (context, v, _) => Stack(
                            children: [
                              const Positioned.fill(child: ColoredBox(color: C.fill5)),
                              FractionallySizedBox(
                                widthFactor: v.clamp(0, 1),
                                child: ColoredBox(color: accent),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  if (job.running) const SizedBox(height: 6),
                  Text(
                    label,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: T.small.copyWith(color: color),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            if (job.running || job.stage == Stage.queued)
              IconBtn(LucideIcons.x, tooltip: 'Отменить', onTap: () => library.cancel(t.id))
            else if (job.stage == Stage.error)
              IconBtn(LucideIcons.refreshCw, tooltip: 'Ещё раз', onTap: () => library.download(t))
            else if (local != null)
              IconBtn(LucideIcons.folderOpen, tooltip: 'Показать в папке', onTap: () => engine.reveal(local.filePath)),
          ],
        ),
      ),
    );
  }
}
