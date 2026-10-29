import 'player/player.dart';
import 'state/auth.dart';
import 'state/engine_state.dart';
import 'state/library.dart';
import 'state/nav.dart';
import 'state/settings.dart';
import 'state/toast.dart';
import 'ui/look.dart';

/// App-wide state, created once after preferences load.
late final Settings settings;
late final Toasts toasts;
late final Library library;
late final EngineState engineState;
late final PlayerStore player;
late final Nav nav;
late final Auth auth;
late final Look look;

void createStores() {
  settings = Settings();
  toasts = Toasts();
  library = Library(settings, toasts);
  engineState = EngineState(toasts);
  player = PlayerStore(settings, library, toasts);
  nav = Nav();
  auth = Auth();
  look = Look(player);
}
