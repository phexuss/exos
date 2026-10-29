import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';

import '../player/player.dart';
import '../stores.dart';

/// Playback position in seconds, advanced every frame between mpv's reports so
/// the seek bar and karaoke move at the display's refresh rate.
final playClock = ValueNotifier<double>(0);

class PlayClock extends StatefulWidget {
  const PlayClock({super.key, required this.child});
  final Widget child;
  @override
  State<PlayClock> createState() => _PlayClockState();
}

class _PlayClockState extends State<PlayClock> with SingleTickerProviderStateMixin {
  late final Ticker _ticker = createTicker(_tick);
  double _reported = 0;
  Duration _reportedAt = Duration.zero;
  Duration _now = Duration.zero;

  @override
  void initState() {
    super.initState();
    player.position.addListener(_onReport);
    player.addListener(_onStatus);
    _onReport();
    _onStatus();
  }

  void _onReport() {
    _reported = player.position.value.inMicroseconds / 1e6;
    _reportedAt = _now;
    playClock.value = _reported;
  }

  void _onStatus() {
    final run = player.status == PlayStatus.playing;
    if (run && !_ticker.isActive) {
      _reportedAt = Duration.zero;
      _now = Duration.zero;
      _ticker.start();
    } else if (!run && _ticker.isActive) {
      _ticker.stop();
      playClock.value = player.position.value.inMicroseconds / 1e6;
    }
  }

  void _tick(Duration elapsed) {
    _now = elapsed;
    // Never run more than a report interval ahead, so a stall doesn't drift.
    final ahead = ((elapsed - _reportedAt).inMicroseconds / 1e6).clamp(0.0, 0.5);
    final total = player.duration.value.inMicroseconds / 1e6;
    final v = _reported + ahead;
    playClock.value = total > 0 && v > total ? total : v;
  }

  @override
  void dispose() {
    player.position.removeListener(_onReport);
    player.removeListener(_onStatus);
    _ticker.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
