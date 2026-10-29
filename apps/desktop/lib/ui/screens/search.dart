import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/format.dart';
import '../../core/models.dart';
import '../../core/services.dart' as services;
import '../../state/nav.dart';
import '../../stores.dart';
import '../look.dart';
import '../tokens.dart';
import '../widgets/controls.dart';
import '../widgets/cover.dart';
import '../widgets/loader.dart';
import '../widgets/motion.dart';
import '../widgets/tracks.dart';
import 'page.dart';

const _moods = ['Электроника', 'Русский рок', 'Хип-хоп', 'Инди', 'Lo-fi', 'Джаз', 'Техно', 'Саундтреки', 'Пост-панк', 'Эмбиент'];

final _link = RegExp(r'^https?://(\S+\.)?(soundcloud\.com|youtube\.com|youtu\.be)/', caseSensitive: false);

/// A pasted SoundCloud or YouTube link as a playable track.
Track _linkTrack(String url) {
  final sc = url.toLowerCase().contains('soundcloud.com');
  final path = url.replaceFirst(RegExp(r'^https?://[^/]+/'), '').replaceFirst(RegExp(r'[?#].*$'), '');
  final parts = path.split('/');
  final who = parts.isNotEmpty ? parts[0] : null;
  final slug = parts.length > 1 ? parts[1] : null;
  return Track(
    id: 'link_$url',
    title: (slug ?? who ?? url).replaceAll(RegExp(r'[-_]+'), ' '),
    artist: Artist(id: '', name: sc ? (who ?? 'SoundCloud') : 'YouTube'),
    durationSec: 0,
    isrc: url,
    source: Source.soundcloud,
  );
}

/// One field that is the whole screen until there is something to show.
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key, required this.query, required this.focus});
  final String query;
  final FocusNode focus;
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  late final _text = TextEditingController(text: widget.query);
  Source _tab = Source.deezer;
  Timer? _debounce;

  /// The last query this field sent, to tell typing apart from a mood click or history.
  late String _sent = widget.query;

  @override
  void didUpdateWidget(SearchScreen old) {
    super.didUpdateWidget(old);
    if (widget.query != old.query && widget.query != _sent) {
      _sent = widget.query;
      _text.text = widget.query;
    }
  }

  void _send(String v) {
    _debounce?.cancel();
    _sent = v.trim();
    nav.go(SearchRoute(_sent));
  }

  void _changed(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () => _send(v));
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _text.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.query.trim();
    return PageScroll(
      children: [
        Field(
          controller: _text,
          focusNode: widget.focus,
          autofocus: true,
          big: true,
          icon: LucideIcons.search,
          hint: 'Что послушать?',
          onChanged: _changed,
          onSubmitted: _send,
        ),
        const SizedBox(height: 28),
        if (q.isEmpty) ..._start() else if (_link.hasMatch(q)) _linkResult(q) else ..._results(q),
      ],
    );
  }

  List<Widget> _start() => [
    const Text(
      'Ищет по Deezer и SoundCloud. Можно вставить ссылку на трек SoundCloud или видео YouTube: yt-dlp скачает его прямо на этот компьютер.',
      style: T.sub,
    ),
    const SizedBox(height: 36),
    const Text('С чего начать', style: T.h2),
    const SizedBox(height: 16),
    Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (var i = 0; i < _moods.length; i++)
          Rise(
            index: i,
            child: _Mood(name: _moods[i]),
          ),
      ],
    ),
  ];

  Widget _linkResult(String url) {
    final t = _linkTrack(url);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _TopResult(track: t, list: [t]),
        const SizedBox(height: 18),
        const Text(
          'yt-dlp откроет ссылку на твоём компьютере. Включи, чтобы слушать сразу, или скачай через меню по правому клику.',
          style: T.sub,
        ),
      ],
    );
  }

  List<Widget> _results(String q) => [
    Row(
      children: [
        Expanded(
          child: Text('«$q»', maxLines: 1, overflow: TextOverflow.ellipsis, style: T.h1),
        ),
        const SizedBox(width: 16),
        Segmented<Source>(
          value: _tab,
          width: 112,
          options: const [(Source.deezer, 'Deezer'), (Source.soundcloud, 'SoundCloud')],
          onChanged: (v) => setState(() => _tab = v),
        ),
      ],
    ),
    const SizedBox(height: 22),
    Loader<List<Track>>(
      key: ValueKey('$q|$_tab'),
      load: () => _tab == Source.deezer ? services.searchDeezer(q) : services.searchSoundCloud(q),
      deps: [q, _tab],
      errorTitle: 'Поиск не сработал',
      loading: const Skeleton(rows: 8),
      builder: (context, list) {
        if (list.isEmpty) {
          return EmptyState(
            icon: LucideIcons.searchX,
            title: 'Ничего не нашлось',
            text: _tab == Source.deezer ? 'Попробуй вкладку SoundCloud: там ремиксы, сеты и редкие треки.' : 'Попробуй другое написание.',
          );
        }
        return LayoutBuilder(
          builder: (context, c) {
            final top = _TopResult(track: list.first, list: list);
            final rest = TrackList(tracks: list.skip(1).take(4).toList(), showAlbum: false);
            final head = c.maxWidth > 860
                ? Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(flex: 2, child: top),
                      const SizedBox(width: 28),
                      Expanded(flex: 3, child: rest),
                    ],
                  )
                : Column(children: [top, const SizedBox(height: 16), rest]);
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                head,
                if (list.length > 5) ...[
                  const SizedBox(height: 36),
                  const Text('Все результаты', style: T.h2),
                  const SizedBox(height: 12),
                  TrackList(tracks: list, showAlbum: _tab == Source.deezer),
                ],
              ],
            );
          },
        );
      },
    ),
  ];
}

class _Mood extends StatelessWidget {
  const _Mood({required this.name});
  final String name;

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    return Tappable(
      onTap: () => nav.go(SearchRoute(name)),
      builder: (context, s) => Bouncy(
        state: s,
        child: AnimatedContainer(
          duration: D.fast,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
          decoration: BoxDecoration(
            color: s.hovered ? accent.withValues(alpha: 0.18) : C.fill2,
            borderRadius: BorderRadius.circular(99),
            border: Border.all(color: s.hovered ? accent.withValues(alpha: 0.4) : C.divider),
          ),
          child: Text(name, style: T.body.copyWith(color: s.hovered ? C.text : C.text2)),
        ),
      ),
    );
  }
}

/// The best match, big, with a play disc that grows under the pointer.
class _TopResult extends StatelessWidget {
  const _TopResult({required this.track, required this.list});
  final Track track;
  final List<Track> list;

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    return Tappable(
      onTap: () => player.playQueue(list),
      onSecondaryTapUp: (d) => showTrackMenu(context, d.globalPosition, track, play: () => player.playQueue(list)),
      builder: (context, s) => Spot(
        state: s,
        radius: R.lg,
        base: C.fill2,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Cover(url: track.coverUrl, seed: track.seed, size: 112, radius: R.md, label: track.title),
                  const Spacer(),
                  AnimatedScale(
                    scale: s.hovered ? 1 : 0.85,
                    duration: D.mid,
                    curve: spring,
                    child: Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: accent,
                        boxShadow: [BoxShadow(color: accent.withValues(alpha: 0.35), blurRadius: 20)],
                      ),
                      child: const Icon(LucideIcons.play, size: 22, color: C.onAccent),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Text(track.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: T.h1.copyWith(fontSize: 26)),
              const SizedBox(height: 6),
              Row(
                children: [
                  _SourcePill(source: track.source),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(track.artist.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: T.sub),
                  ),
                  if (track.durationSec > 0) Text(' · ${formatTime(track.durationSec)}', style: T.sub),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SourcePill extends StatelessWidget {
  const _SourcePill({required this.source});
  final Source source;

  @override
  Widget build(BuildContext context) {
    final sc = source == Source.soundcloud;
    final c = sc ? C.soundcloud : C.deezer;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: c.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(99)),
      child: Text(
        sc ? 'SoundCloud' : 'Deezer',
        style: T.small.copyWith(color: sc ? C.soundcloudText : C.deezerText, fontWeight: FontWeight.w500),
      ),
    );
  }
}
