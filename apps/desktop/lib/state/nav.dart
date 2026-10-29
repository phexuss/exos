import 'package:flutter/foundation.dart';

sealed class AppRoute {
  const AppRoute();
  String get key;
}

class HomeRoute extends AppRoute {
  const HomeRoute();
  @override
  String get key => 'home';
}

class SearchRoute extends AppRoute {
  const SearchRoute([this.query = '']);
  final String query;
  @override
  String get key => 'search';
}

class LibraryRoute extends AppRoute {
  const LibraryRoute();
  @override
  String get key => 'library';
}

class DownloadsRoute extends AppRoute {
  const DownloadsRoute();
  @override
  String get key => 'downloads';
}

class SettingsRoute extends AppRoute {
  const SettingsRoute();
  @override
  String get key => 'settings';
}

class AlbumRoute extends AppRoute {
  const AlbumRoute(this.id);
  final String id;
  @override
  String get key => 'album:$id';
}

class ArtistRoute extends AppRoute {
  const ArtistRoute(this.id);
  final String id;
  @override
  String get key => 'artist:$id';
}

class Nav extends ChangeNotifier {
  final _stack = <AppRoute>[const HomeRoute()];
  var _index = 0;

  /// 1 going forward, -1 going back: screens slide in from that side.
  int dir = 1;

  AppRoute get route => _stack[_index];
  bool get canBack => _index > 0;
  bool get canForward => _index < _stack.length - 1;

  void go(AppRoute r) {
    if (r.key == route.key && r is! SearchRoute) return;
    if (r.key == route.key) {
      _stack[_index] = r;
    } else {
      _stack.removeRange(_index + 1, _stack.length);
      _stack.add(r);
      if (_stack.length > 50) _stack.removeAt(0);
      _index = _stack.length - 1;
      dir = 1;
    }
    notifyListeners();
  }

  void back() {
    if (!canBack) return;
    _index--;
    dir = -1;
    notifyListeners();
  }

  void forward() {
    if (!canForward) return;
    _index++;
    dir = 1;
    notifyListeners();
  }
}
