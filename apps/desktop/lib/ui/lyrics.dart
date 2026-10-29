import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../core/models.dart';
import '../stores.dart';
import 'clock.dart';
import 'look.dart';
import 'tokens.dart';
import 'widgets/controls.dart';
import 'widgets/motion.dart';

/// Synced lyrics: the current line fills with colour as it is sung, the view
/// follows it, and a click on any line seeks there. Plain lyrics just scroll.
class LyricsView extends StatefulWidget {
  const LyricsView({super.key, this.big = false});
  final bool big;
  @override
  State<LyricsView> createState() => _LyricsViewState();
}

class _LyricsViewState extends State<LyricsView> {
  final _scroll = ScrollController();
  List<LyricLine> _lines = const [];
  List<GlobalKey> _keys = const [];
  String? _plain;
  Lyrics? _for;
  int _active = -1;
  Timer? _userScroll;

  @override
  void initState() {
    super.initState();
    player.addListener(_onPlayer);
    playClock.addListener(_onClock);
    _onPlayer();
  }

  void _onPlayer() {
    final l = player.lyrics;
    if (identical(l, _for)) return;
    setState(() {
      _for = l;
      final synced = l?.synced;
      _lines = synced == null || synced.isEmpty ? const [] : parseLrc(synced);
      _keys = [for (final _ in _lines) GlobalKey()];
      _plain = _lines.isEmpty ? l?.plain : null;
      _active = -1;
    });
    if (_scroll.hasClients) _scroll.jumpTo(0);
  }

  void _onClock() {
    if (_lines.isEmpty) return;
    final i = activeLine(_lines, playClock.value);
    if (i == _active) return;
    setState(() => _active = i);
    if (_userScroll?.isActive ?? false) return;
    final ctx = i >= 0 ? _keys[i].currentContext : null;
    if (ctx != null) {
      Scrollable.ensureVisible(ctx, alignment: 0.38, duration: reduceMotion(context) ? Duration.zero : D.lazy, curve: easeOut);
    }
  }

  @override
  void dispose() {
    player.removeListener(_onPlayer);
    playClock.removeListener(_onClock);
    _userScroll?.cancel();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final base = widget.big ? T.display.copyWith(fontSize: 34, height: 1.25) : T.h2.copyWith(fontSize: 19, height: 1.35);
    if (player.current == null) {
      return const EmptyState(
        icon: LucideIcons.micVocal,
        title: 'Здесь будет текст',
        text: 'Включи что-нибудь, и строки побегут под музыку.',
      );
    }
    if (_lines.isEmpty && (_plain == null || _plain!.isEmpty)) {
      return EmptyState(
        icon: LucideIcons.micVocal,
        title: _for == null ? 'Ищу текст…' : 'Текста нет',
        text: _for == null ? null : 'LRCLIB не знает этот трек. Бывает с ремиксами и записями с SoundCloud.',
      );
    }
    final fade = ShaderMask(
      shaderCallback: (r) => const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0x00FFFFFF), Color(0xFFFFFFFF), Color(0xFFFFFFFF), Color(0x00FFFFFF)],
        stops: [0, 0.1, 0.85, 1],
      ).createShader(r),
      blendMode: BlendMode.dstIn,
      child: Listener(
        onPointerSignal: (e) {
          if (e is PointerScrollEvent) {
            _userScroll?.cancel();
            _userScroll = Timer(const Duration(seconds: 3), () {});
          }
        },
        child: SingleChildScrollView(
          controller: _scroll,
          padding: EdgeInsets.symmetric(vertical: widget.big ? 160 : 60, horizontal: widget.big ? 0 : 4),
          child: _lines.isEmpty
              ? Text(
                  _plain!,
                  style: base.copyWith(color: C.text2, fontSize: base.fontSize! * 0.8),
                )
              : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [for (var i = 0; i < _lines.length; i++) _line(i, base)]),
        ),
      ),
    );
    return fade;
  }

  Widget _line(int i, TextStyle base) {
    final l = _lines[i];
    final active = i == _active;
    final past = i < _active;
    final text = l.text.isEmpty ? '♪' : l.text;
    final child = active
        ? _Karaoke(line: l, next: i + 1 < _lines.length ? _lines[i + 1].time : null, style: base)
        : Text(text, style: base.copyWith(color: past ? C.text3 : C.text4));
    return Tappable(
      key: _keys[i],
      onTap: () => player.seek(Duration(milliseconds: (l.time * 1000).round())),
      focusable: false,
      builder: (context, s) => Padding(
        padding: EdgeInsets.symmetric(vertical: widget.big ? 10 : 7),
        child: AnimatedScale(
          scale: active ? 1 : (s.hovered ? 0.98 : 0.95),
          alignment: Alignment.centerLeft,
          duration: D.slow,
          curve: spring,
          child: AnimatedOpacity(duration: D.mid, opacity: s.hovered && !active ? 1 : (active ? 1 : 0.85), child: child),
        ),
      ),
    );
  }
}

/// The line being sung, filled left to right as it goes.
class _Karaoke extends StatelessWidget {
  const _Karaoke({required this.line, required this.next, required this.style});
  final LyricLine line;
  final double? next;
  final TextStyle style;

  @override
  Widget build(BuildContext context) {
    final accent = Accent.of(context);
    final span = ((next ?? line.time + 4) - line.time).clamp(0.6, 12.0);
    return ValueListenableBuilder<double>(
      valueListenable: playClock,
      builder: (context, t, _) {
        final p = ((t - line.time) / span).clamp(0.0, 1.0);
        return ShaderMask(
          blendMode: BlendMode.srcIn,
          shaderCallback: (r) => LinearGradient(
            colors: [C.text, Color.lerp(C.text, accent, 0.5)!, C.text3, C.text3],
            stops: [0, p, (p + 0.04).clamp(0, 1), 1],
          ).createShader(r),
          child: Text(line.text.isEmpty ? '♪' : line.text, style: style.copyWith(color: C.text)),
        );
      },
    );
  }
}
