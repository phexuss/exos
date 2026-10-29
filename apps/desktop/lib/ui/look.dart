import 'package:flutter/widgets.dart';

import '../player/player.dart';
import 'palette.dart';

/// The colours of whatever is playing: the ambient light and the accent.
class Look extends ChangeNotifier {
  Look(this._player) {
    _player.addListener(_sync);
  }
  final PlayerStore _player;
  CoverPalette palette = CoverPalette.idle;
  String? _for;

  Future<void> _sync() async {
    final t = _player.current;
    final key = t == null ? null : '${t.coverUrl}|${t.seed}';
    if (key == _for) return;
    _for = key;
    final p = t == null ? CoverPalette.idle : await CoverPalette.of(t.coverUrl, t.seed);
    if (_for != key) return;
    palette = p;
    notifyListeners();
  }
}

/// The accent, animated between covers, for everything below it.
class Accent extends InheritedWidget {
  const Accent({super.key, required this.color, required super.child});
  final Color color;

  static Color of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<Accent>()!.color;

  @override
  bool updateShouldNotify(Accent old) => old.color != color;
}
