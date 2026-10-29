import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../engine/engine.dart';
import '../state/nav.dart';
import '../stores.dart';
import 'look.dart';
import 'tokens.dart';
import 'widgets/glass.dart';
import 'widgets/motion.dart';

typedef _Item = (String key, String label, IconData icon, AppRoute Function() route);

final List<_Item> _items = [
  ('home', 'Главная', LucideIcons.house, () => const HomeRoute()),
  ('search', 'Поиск', LucideIcons.search, () => const SearchRoute('')),
  ('library', 'Медиатека', LucideIcons.library, () => const LibraryRoute()),
  ('downloads', 'Загрузки', LucideIcons.arrowDownToLine, () => const DownloadsRoute()),
  ('settings', 'Настройки', LucideIcons.settings, () => const SettingsRoute()),
];

const _rowH = 42.0;

/// Navigation rail: a lit pill glides to the current section.
class Sidebar extends StatelessWidget {
  const Sidebar({super.key, required this.compact});
  final bool compact;

  @override
  Widget build(BuildContext context) => Glass(
    padding: EdgeInsets.symmetric(horizontal: compact ? 8 : 10, vertical: 12),
    child: ListenableBuilder(
      listenable: Listenable.merge([nav, library, engineState]),
      builder: (context, _) {
        final key = nav.route.key;
        final i = _items.indexWhere((it) => it.$1 == key);
        final active = library.jobs.values.where((j) => j.running).length;
        final accent = Accent.of(context);
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              height: _rowH * _items.length,
              child: Stack(
                children: [
                  AnimatedPositioned(
                    duration: D.slow,
                    curve: spring,
                    top: (i < 0 ? 0 : i) * _rowH,
                    left: 0,
                    right: 0,
                    height: _rowH,
                    child: AnimatedOpacity(
                      duration: D.fast,
                      opacity: i < 0 ? 0 : 1,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(R.md),
                          gradient: LinearGradient(colors: [accent.withValues(alpha: 0.22), accent.withValues(alpha: 0.06)]),
                          border: Border.all(color: accent.withValues(alpha: 0.25)),
                        ),
                      ),
                    ),
                  ),
                  Column(
                    children: [
                      for (var n = 0; n < _items.length; n++)
                        _Row(
                          item: _items[n],
                          selected: n == i,
                          compact: compact,
                          badge: _items[n].$1 == 'downloads' && active > 0 ? '$active' : null,
                        ),
                    ],
                  ),
                ],
              ),
            ),
            const Spacer(),
            if (!compact) const _EngineCard(),
            if (!compact) const SizedBox(height: 10),
            _UserRow(compact: compact),
          ],
        );
      },
    ),
  );
}

class _Row extends StatelessWidget {
  const _Row({required this.item, required this.selected, required this.compact, this.badge});
  final _Item item;
  final bool selected;
  final bool compact;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    final row = Tappable(
      onTap: () => nav.go(item.$4()),
      builder: (context, s) => SizedBox(
        height: _rowH,
        child: AnimatedContainer(
          duration: D.fast,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(R.md),
            color: s.hovered && !selected ? C.hover : const Color(0x00000000),
            border: s.focused ? Border.all(color: C.glassRimStrong) : null,
          ),
          padding: EdgeInsets.symmetric(horizontal: compact ? 0 : 12),
          child: Row(
            mainAxisAlignment: compact ? MainAxisAlignment.center : MainAxisAlignment.start,
            children: [
              AnimatedScale(
                scale: s.pressed ? 0.85 : (s.hovered ? 1.1 : 1),
                duration: D.mid,
                curve: spring,
                child: Icon(item.$3, size: 18, color: selected ? accent : (s.hovered ? C.text : C.text2)),
              ),
              if (!compact) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    item.$2,
                    style: T.body.copyWith(color: selected ? C.text : C.text2, fontWeight: selected ? FontWeight.w500 : FontWeight.w400),
                  ),
                ),
                if (badge != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1),
                    decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(99)),
                    child: Text(
                      badge!,
                      style: T.small.copyWith(color: C.onAccent, fontWeight: FontWeight.w700),
                    ),
                  ),
              ],
            ],
          ),
        ),
      ),
    );
    return compact ? Tooltip(message: item.$2, child: row) : row;
  }
}

/// What the local engine can do right now, and where to fix it if not.
class _EngineCard extends StatelessWidget {
  const _EngineCard();

  @override
  Widget build(BuildContext context) {
    final st = engineState.status;
    final installing = engineState.installing;
    final String title;
    final String text;
    final Color dot;
    if (installing != null) {
      title = 'Ставлю ${_name(installing.$1)}';
      text = '${(installing.$2 * 100).round()}%';
      dot = C.warning;
    } else if (st == null) {
      title = 'Проверяю движок';
      text = 'yt-dlp, Deno, ffmpeg';
      dot = C.text4;
    } else if (st.ytdlp == null) {
      title = 'Нужен yt-dlp';
      text = 'Без него музыка не играет. Поставить в настройках.';
      dot = C.danger;
    } else if (st.jsRuntime == null || st.ffmpeg == null) {
      title = 'Движок не полный';
      text = st.jsRuntime == null ? 'YouTube без Deno часто отказывает.' : 'Без ffmpeg не будет mp3.';
      dot = C.warning;
    } else {
      title = 'Движок готов';
      text = 'yt-dlp ${st.ytdlp!.version}';
      dot = C.ok;
    }
    return Tappable(
      onTap: () => nav.go(const SettingsRoute()),
      builder: (context, s) => AnimatedContainer(
        duration: D.fast,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: s.hovered ? C.fill3 : C.fill2, borderRadius: BorderRadius.circular(R.md)),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 5),
              child: _Dot(color: dot, pulse: installing != null),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: T.sub.copyWith(color: C.text, fontWeight: FontWeight.w500),
                  ),
                  Text(text, style: T.small),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static String _name(Tool t) => switch (t) {
    Tool.ytdlp => 'yt-dlp',
    Tool.ffmpeg => 'ffmpeg',
    Tool.deno => 'Deno',
  };
}

class _Dot extends StatefulWidget {
  const _Dot({required this.color, required this.pulse});
  final Color color;
  final bool pulse;
  @override
  State<_Dot> createState() => _DotState();
}

class _DotState extends State<_Dot> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400));

  @override
  void didUpdateWidget(_Dot old) {
    super.didUpdateWidget(old);
    widget.pulse ? _c.repeat() : _c.stop();
  }

  @override
  void initState() {
    super.initState();
    if (widget.pulse) _c.repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _c,
    builder: (context, _) => Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: widget.color,
        boxShadow: [
          BoxShadow(
            color: widget.color.withValues(alpha: 0.6 * (1 - _c.value)),
            blurRadius: 2 + 8 * _c.value,
            spreadRadius: 4 * _c.value,
          ),
        ],
      ),
    ),
  );
}

class _UserRow extends StatelessWidget {
  const _UserRow({required this.compact});
  final bool compact;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: auth,
    builder: (context, _) {
      final u = auth.user;
      final accent = Accent.of(context);
      final initial = (u?.name.isNotEmpty ?? false) ? u!.name.characters.first.toUpperCase() : '·';
      final avatar = Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(colors: [accent, accent.withValues(alpha: 0.4)]),
        ),
        child: Center(
          child: Text(
            initial,
            style: T.title.copyWith(color: C.onAccent, fontWeight: FontWeight.w700),
          ),
        ),
      );
      if (compact) return Center(child: avatar);
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        child: Row(
          children: [
            avatar,
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    u?.name ?? 'Без входа',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: T.sub.copyWith(color: C.text),
                  ),
                  if (u != null) Text('@${u.username}', maxLines: 1, overflow: TextOverflow.ellipsis, style: T.small),
                ],
              ),
            ),
          ],
        ),
      );
    },
  );
}
