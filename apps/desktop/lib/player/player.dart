import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';

import '../core/env.dart';
import '../core/models.dart';
import '../core/services.dart' as services;
import '../engine/engine.dart';
import '../state/library.dart';
import '../state/settings.dart';
import '../state/toast.dart';
import 'backend.dart';

enum PlayStatus { idle, loading, playing, paused }

enum Repeat { off, all, one }

enum Panel { lyrics, queue }

class PlayerStore extends ChangeNotifier {
  PlayerStore(this._settings, this._library, this._toasts) : _audio = kMock ? FakeBackend() : MpvBackend() {
    _audio.setVolume(_settings.volume);
    _audio.position.listen((p) => position.value = p);
    _audio.duration.listen((d) {
      if (d > Duration.zero) duration.value = d;
    });
    _audio.playing.listen((on) {
      if (status == PlayStatus.loading) return;
      _set(() => status = on ? PlayStatus.playing : (current == null ? PlayStatus.idle : PlayStatus.paused));
    });
    _audio.ended.listen((_) => _onEnded());
    _audio.errors.listen((e) => debugPrint('mpv: $e'));
  }

  final Settings _settings;
  final Library _library;
  final Toasts _toasts;
  final AudioBackend _audio;

  List<Track> queue = [];

  /// Order before shuffle, to restore it.
  List<Track>? _original;
  int index = 0;
  Track? current;
  PlayStatus status = PlayStatus.idle;

  /// What the engine is doing while loading, shown under the title.
  String? note;
  Repeat repeat = Repeat.off;
  bool shuffle = false;
  Panel? panel = Panel.lyrics;
  bool nowPlaying = false;
  Lyrics? lyrics;

  /// Ticks many times a second; kept apart so only the seek bar and lyrics rebuild.
  final position = ValueNotifier(Duration.zero);
  final duration = ValueNotifier(Duration.zero);

  void _set(VoidCallback f) {
    f();
    notifyListeners();
  }

  /* ---------- resolving ---------- */

  final _urlCache = <String, ResolvedStream>{};
  final _inFlight = <String, Future<ResolvedStream>>{};
  int _seq = 0;

  Future<ResolvedStream> _resolve(Track t, {bool fresh = false}) {
    final cached = _urlCache[t.id];
    if (!fresh && cached != null && (cached.expires?.isAfter(DateTime.now()) ?? true)) return Future.value(cached);
    return _inFlight[t.id] ??= () async {
      try {
        final browser = _settings.cookiesBrowser;
        final remembered = rememberedSource(t.id);
        ResolvedStream s;
        try {
          s = await engine.resolve(sourceRequest(t, browser));
        } catch (_) {
          if (remembered == null) rethrow;
          // The remembered video may be gone; search again.
          rememberSource(t.id, null);
          s = await engine.resolve(sourceRequest(t, browser));
        }
        if (s.sourceUrl != null && t.source != Source.soundcloud) rememberSource(t.id, s.sourceUrl);
        _urlCache[t.id] = s;
        return s;
      } finally {
        _inFlight.remove(t.id);
      }
    }();
  }

  Future<ResolvedStream> _playable(Track t, {bool fresh = false}) async {
    final local = _library.get(t.id);
    if (local != null) return ResolvedStream(url: local.filePath);
    _set(() => note = t.source == Source.soundcloud ? 'Получаю поток SoundCloud…' : 'yt-dlp ищет источник…');
    return _resolve(t, fresh: fresh);
  }

  Timer? _prefetch;

  /// Resolves the next track while this one plays, so skipping starts at once.
  void _schedulePrefetch() {
    _prefetch?.cancel();
    final next = index + 1 < queue.length ? queue[index + 1] : (repeat == Repeat.all && queue.isNotEmpty ? queue.first : null);
    if (next == null || kMock || _library.isDownloaded(next.id)) return;
    _prefetch = Timer(const Duration(seconds: 4), () => _resolve(next).catchError((_) => const ResolvedStream(url: '')));
  }

  /* ---------- loading ---------- */

  int _recoveries = 0;

  Future<void> _load(int i, {Duration start = Duration.zero, bool fresh = false}) async {
    if (i < 0 || i >= queue.length) return;
    final t = queue[i];
    final seq = ++_seq;
    final sameTrack = current?.id == t.id;
    if (!sameTrack) _recoveries = 0;
    _set(() {
      index = i;
      current = t;
      status = PlayStatus.loading;
      note = null;
    });
    position.value = start;
    duration.value = Duration(seconds: t.durationSec);
    if (!sameTrack) _loadLyrics(t);
    try {
      final s = await _playable(t, fresh: fresh);
      if (seq != _seq) return;
      final audio = _audio;
      if (audio is FakeBackend) audio.length = Duration(seconds: max(30, t.durationSec));
      await _audio.open(s.url, headers: s.headers, start: start);
      if (seq != _seq) return;
      _set(() {
        status = PlayStatus.playing;
        note = null;
      });
      _schedulePrefetch();
      if (!sameTrack) services.syncPlayed(t);
    } catch (e) {
      if (seq != _seq) return;
      _urlCache.remove(t.id);
      _set(() {
        status = PlayStatus.paused;
        note = null;
      });
      _toasts.show('Не получилось включить «${t.title}»: $e', ToastKind.error);
    }
  }

  /// mpv reports the end of a stream both when the track finished and when a
  /// CDN link died part-way (expired signature, a refused range). In the
  /// second case fetch a fresh link and carry on from the same spot.
  void _onEnded() {
    final t = current;
    if (t == null || status == PlayStatus.loading) return;
    final at = position.value;
    final total = duration.value;
    final early = total > const Duration(seconds: 5) && at < total - const Duration(seconds: 3);
    if (early && !_library.isDownloaded(t.id) && !kMock && _recoveries < 2) {
      _recoveries++;
      _load(index, start: at, fresh: true);
      return;
    }
    if (repeat == Repeat.one) {
      _load(index);
    } else if (index < queue.length - 1) {
      _load(index + 1);
    } else if (repeat == Repeat.all && queue.isNotEmpty) {
      _load(0);
    } else {
      _set(() => status = PlayStatus.paused);
    }
  }

  Future<void> _loadLyrics(Track t) async {
    final local = _library.get(t.id);
    if (local != null && (local.syncedLyrics != null || local.plainLyrics != null)) {
      _set(() => lyrics = Lyrics(synced: local.syncedLyrics, plain: local.plainLyrics));
      return;
    }
    _set(() => lyrics = null);
    final l = await services.getLyrics(t);
    if (current?.id == t.id) _set(() => lyrics = l ?? const Lyrics());
  }

  /* ---------- actions ---------- */

  static List<T> _shuffled<T>(List<T> items) => [...items]..shuffle(Random());

  void playQueue(List<Track> tracks, [int start = 0]) {
    if (tracks.isEmpty) return;
    if (shuffle) {
      final first = tracks[start];
      queue = [
        first,
        ..._shuffled([...tracks]..removeAt(start)),
      ];
      _original = tracks;
      _load(0);
    } else {
      queue = tracks;
      _original = null;
      _load(start);
    }
  }

  void playTrack(Track t) => playQueue([t]);

  /// Jumps to a track already in the queue.
  void playAt(int i) {
    if (i >= 0 && i < queue.length) _load(i);
  }

  void playNext(Track t) {
    if (queue.isEmpty) return playTrack(t);
    _set(() => queue = [...queue.sublist(0, index + 1), t, ...queue.sublist(index + 1)]);
    _toasts.show('Следующим: ${t.title}');
  }

  void addToQueue(Track t) {
    if (queue.isEmpty) return playTrack(t);
    _set(() => queue = [...queue, t]);
    _toasts.show('В очереди: ${t.title}');
  }

  void removeFromQueue(int i) {
    if (i == index) return;
    _set(() {
      queue = [...queue]..removeAt(i);
      if (i < index) index--;
    });
  }

  void toggle() {
    if (current == null) return;
    if (status == PlayStatus.playing) {
      _audio.pause();
    } else if (status == PlayStatus.paused) {
      // A link resolved long ago may have expired while paused.
      final s = _urlCache[current!.id];
      if (s?.expires != null && s!.expires!.isBefore(DateTime.now())) {
        _load(index, start: position.value, fresh: true);
      } else {
        _audio.play();
      }
    }
  }

  void next() {
    if (index < queue.length - 1) {
      _load(index + 1);
    } else if (repeat == Repeat.all && queue.isNotEmpty) {
      _load(0);
    }
  }

  void prev() {
    if (position.value > const Duration(seconds: 3) || index == 0) {
      seek(Duration.zero);
    } else {
      _load(index - 1);
    }
  }

  void seek(Duration to) {
    final d = duration.value;
    final clamped = to < Duration.zero ? Duration.zero : (d > Duration.zero && to > d ? d : to);
    position.value = clamped;
    _audio.seek(clamped);
  }

  void setVolume(double v) {
    _audio.setVolume(v);
    _settings.set(volume: v);
    notifyListeners();
  }

  void toggleShuffle() => _set(() {
    final cur = current;
    if (!shuffle) {
      final rest = _shuffled([...queue]..removeAt(index.clamp(0, max(0, queue.length - 1))));
      _original = queue;
      queue = cur != null ? [cur, ...rest] : rest;
      index = 0;
      shuffle = true;
    } else {
      final base = _original ?? queue;
      final at = cur == null ? 0 : base.indexWhere((t) => t.id == cur.id);
      queue = base;
      index = max(0, at);
      _original = null;
      shuffle = false;
    }
  });

  void cycleRepeat() => _set(() => repeat = Repeat.values[(repeat.index + 1) % Repeat.values.length]);

  void togglePanel(Panel p) => _set(() => panel = panel == p ? null : p);

  void setNowPlaying(bool open) {
    if (open && current == null) return;
    _set(() => nowPlaying = open);
  }
}
