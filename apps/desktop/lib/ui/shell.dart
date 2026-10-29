import 'package:flutter/widgets.dart';

import '../player/player.dart';
import '../state/nav.dart';
import '../state/toast.dart';
import '../stores.dart';
import 'player_dock.dart';
import 'screens/album.dart';
import 'screens/artist.dart';
import 'screens/downloads.dart';
import 'screens/home.dart';
import 'screens/library.dart';
import 'screens/search.dart';
import 'screens/settings.dart';
import 'side_panel.dart';
import 'sidebar.dart';
import 'titlebar.dart';
import 'tokens.dart';
import 'widgets/ambient.dart';
import 'widgets/glass.dart';

/// Focus for the search field, so Ctrl+K can reach it from anywhere.
final searchFocus = FocusNode(debugLabel: 'search');

void openSearch() {
  final r = nav.route;
  nav.go(SearchRoute(r is SearchRoute ? r.query : ''));
  WidgetsBinding.instance.addPostFrameCallback((_) => searchFocus.requestFocus());
}

/// The main window: moving light at the back, glass panels over it, the
/// player floating along the bottom.
class Shell extends StatelessWidget {
  const Shell({super.key});

  @override
  Widget build(BuildContext context) => Stack(
    fit: StackFit.expand,
    children: [
      ListenableBuilder(
        listenable: Listenable.merge([look, player]),
        builder: (context, _) => AmbientBackground(palette: look.palette, playing: player.status == PlayStatus.playing),
      ),
      Column(
        children: [
          const TitleBar(onSearch: openSearch),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: LayoutBuilder(
                builder: (context, c) {
                  final compact = c.maxWidth < 980;
                  final roomForPanel = c.maxWidth >= 1160;
                  return Column(
                    children: [
                      Expanded(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            AnimatedContainer(
                              duration: D.mid,
                              curve: easeOut,
                              width: compact ? 64 : 224,
                              child: Sidebar(compact: compact),
                            ),
                            const SizedBox(width: 12),
                            const Expanded(child: Glass(child: _Pages())),
                            ListenableBuilder(
                              listenable: player,
                              builder: (context, _) {
                                final p = roomForPanel ? player.panel : null;
                                return AnimatedSize(
                                  duration: D.slow,
                                  curve: easeOut,
                                  alignment: Alignment.centerLeft,
                                  child: p == null
                                      ? const SizedBox(width: 0)
                                      : Padding(
                                          padding: const EdgeInsets.only(left: 12),
                                          child: SizedBox(
                                            width: (c.maxWidth * 0.24).clamp(300.0, 380.0),
                                            child: SidePanel(panel: p),
                                          ),
                                        ),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      const PlayerDock(),
                    ],
                  );
                },
              ),
            ),
          ),
        ],
      ),
      const Positioned(left: 0, right: 0, bottom: 112, child: _Toasts()),
    ],
  );
}

/// Screens slide in from the side you're heading to; the old one just fades.
class _Pages extends StatelessWidget {
  const _Pages();

  Widget _screen(AppRoute r) => switch (r) {
    HomeRoute() => const HomeScreen(),
    SearchRoute(:final query) => SearchScreen(query: query, focus: searchFocus),
    LibraryRoute() => const LibraryScreen(),
    DownloadsRoute() => const DownloadsScreen(),
    SettingsRoute() => const SettingsScreen(),
    AlbumRoute(:final id) => AlbumScreen(id: id),
    ArtistRoute(:final id) => ArtistScreen(id: id),
  };

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: nav,
    builder: (context, _) {
      final r = nav.route;
      final key = ValueKey(r.key);
      final dir = nav.dir.toDouble();
      return AnimatedSwitcher(
        duration: D.slow,
        reverseDuration: D.fast,
        switchInCurve: Curves.linear,
        layoutBuilder: (cur, prev) => Stack(fit: StackFit.expand, children: [...prev, ?cur]),
        transitionBuilder: (child, a) {
          if (child.key != key) return FadeTransition(opacity: a, child: child);
          return FadeTransition(
            opacity: CurvedAnimation(parent: a, curve: easeOut),
            child: SlideTransition(
              position: Tween(begin: Offset(0.035 * dir, 0), end: Offset.zero).animate(CurvedAnimation(parent: a, curve: spring)),
              child: child,
            ),
          );
        },
        child: KeyedSubtree(key: key, child: _screen(r)),
      );
    },
  );
}

class _Toasts extends StatelessWidget {
  const _Toasts();

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: toasts,
    builder: (context, _) => Column(
      mainAxisSize: MainAxisSize.min,
      children: [for (final t in toasts.items) _Toast(key: ValueKey(t.id), item: t)],
    ),
  );
}

class _Toast extends StatelessWidget {
  const _Toast({super.key, required this.item});
  final ToastItem item;

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
    tween: Tween(begin: 0, end: 1),
    duration: D.slow,
    curve: spring,
    builder: (context, v, child) => Opacity(
      opacity: v.clamp(0, 1),
      child: Transform.translate(offset: Offset(0, (1 - v) * 16), child: child),
    ),
    child: Padding(
      padding: const EdgeInsets.only(top: 8),
      child: GestureDetector(
        onTap: () => toasts.dismiss(item.id),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Glass(
            radius: 99,
            tint: C.glassMenu,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
            child: Text(
              item.text,
              textAlign: TextAlign.center,
              style: T.sub.copyWith(color: item.kind == ToastKind.error ? C.danger : C.text),
            ),
          ),
        ),
      ),
    ),
  );
}
