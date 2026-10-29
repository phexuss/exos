import 'dart:async';

import 'package:media_kit/media_kit.dart';

/// What the player store needs from an audio engine: mpv on the desktop,
/// a ticking clock in the prototype.
abstract class AudioBackend {
  Stream<Duration> get position;
  Stream<Duration> get duration;
  Stream<bool> get playing;
  Stream<bool> get buffering;

  /// Playback reached the end of the file (or the stream gave out early).
  Stream<void> get ended;
  Stream<String> get errors;

  Future<void> open(String uri, {Map<String, String> headers = const {}, Duration start = Duration.zero});
  Future<void> play();
  Future<void> pause();
  Future<void> seek(Duration to);
  Future<void> setVolume(double v);
  Future<void> stop();
}

class MpvBackend implements AudioBackend {
  MpvBackend()
    : _p = Player(
        configuration: const PlayerConfiguration(title: 'EXØS', logLevel: MPVLogLevel.warn),
      );
  final Player _p;

  @override
  Stream<Duration> get position => _p.stream.position;
  @override
  Stream<Duration> get duration => _p.stream.duration;
  @override
  Stream<bool> get playing => _p.stream.playing;
  @override
  Stream<bool> get buffering => _p.stream.buffering;
  @override
  Stream<void> get ended => _p.stream.completed.where((c) => c);
  @override
  Stream<String> get errors => _p.stream.error;

  @override
  Future<void> open(String uri, {Map<String, String> headers = const {}, Duration start = Duration.zero}) =>
      _p.open(Media(uri, httpHeaders: headers, start: start == Duration.zero ? null : start));
  @override
  Future<void> play() => _p.play();
  @override
  Future<void> pause() => _p.pause();
  @override
  Future<void> seek(Duration to) => _p.seek(to);
  @override
  Future<void> setVolume(double v) => _p.setVolume(v * 100);
  @override
  Future<void> stop() => _p.stop();
}

/// Plays nothing; advances a clock so the prototype's lyrics and seek bar move.
class FakeBackend implements AudioBackend {
  final _pos = StreamController<Duration>.broadcast();
  final _dur = StreamController<Duration>.broadcast();
  final _playing = StreamController<bool>.broadcast();
  final _ended = StreamController<void>.broadcast();
  Timer? _t;
  Duration _at = Duration.zero;

  /// Set by the store before open(): the catalogue length of the track.
  Duration length = const Duration(minutes: 4);

  @override
  Stream<Duration> get position => _pos.stream;
  @override
  Stream<Duration> get duration => _dur.stream;
  @override
  Stream<bool> get playing => _playing.stream;
  @override
  Stream<bool> get buffering => const Stream.empty();
  @override
  Stream<void> get ended => _ended.stream;
  @override
  Stream<String> get errors => const Stream.empty();

  @override
  Future<void> open(String uri, {Map<String, String> headers = const {}, Duration start = Duration.zero}) async {
    _at = start;
    _dur.add(length);
    await play();
  }

  @override
  Future<void> play() async {
    _t?.cancel();
    _t = Timer.periodic(const Duration(milliseconds: 250), (_) {
      _at += const Duration(milliseconds: 250);
      _pos.add(_at);
      if (_at >= length) {
        _t?.cancel();
        _playing.add(false);
        _ended.add(null);
      }
    });
    _playing.add(true);
  }

  @override
  Future<void> pause() async {
    _t?.cancel();
    _playing.add(false);
  }

  @override
  Future<void> seek(Duration to) async {
    _at = to;
    _pos.add(_at);
  }

  @override
  Future<void> setVolume(double v) async {}

  @override
  Future<void> stop() async {
    _t?.cancel();
    _playing.add(false);
  }
}
