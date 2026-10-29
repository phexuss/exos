import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../core/env.dart';
import '../core/mock.dart' as mock;
import '../core/models.dart';
import '../core/services.dart' as services;
import '../engine/engine.dart';
import 'settings.dart';
import 'toast.dart';

class DownloadJob {
  DownloadJob(this.track) : startedAt = DateTime.now();
  final Track track;
  final DateTime startedAt;
  Stage stage = Stage.queued;
  double progress = 0;
  String? speed;
  String? eta;
  String? error;

  bool get running => stage == Stage.resolving || stage == Stage.downloading || stage == Stage.converting;
}

/// Downloaded tracks (library.json, shared with the Tauri build) and the
/// download queue.
class Library extends ChangeNotifier {
  Library(this._settings, this._toasts);
  final Settings _settings;
  final Toasts _toasts;

  static const _maxParallel = 2;

  List<LocalTrack> tracks = [];
  bool loaded = false;

  /// Keyed by track id; finished jobs stay until cleared so Downloads shows history.
  final jobs = <String, DownloadJob>{};
  String _defaultDir = '';

  String get musicDir => _settings.musicDir ?? _defaultDir;

  Future<void> load() async {
    try {
      _defaultDir = (await engine.status()).musicDir;
    } catch (_) {}
    if (kMock) {
      tracks = [
        for (final (i, t) in mock.tracks.take(9).indexed)
          LocalTrack(
            track: t,
            filePath: '~/Music/EXØS/${t.artist.name} - ${t.title}.m4a',
            format: 'm4a',
            downloadedAt: DateTime.now().subtract(Duration(hours: (i * 41).round())),
          ),
      ];
    } else {
      try {
        final raw = await engine.readLibrary();
        if (raw != null) {
          tracks = [for (final j in jsonDecode(raw) as List) LocalTrack.fromJson((j as Map).cast<String, Object?>())];
        }
      } catch (e) {
        _toasts.show('library.json не прочитался: $e', ToastKind.error);
      }
    }
    loaded = true;
    notifyListeners();
  }

  void _save() => engine.writeLibrary(jsonEncode([for (final t in tracks) t.toJson()])).catchError((_) {});

  LocalTrack? get(String id) {
    for (final t in tracks) {
      if (t.track.id == id) return t;
    }
    return null;
  }

  bool isDownloaded(String id) => get(id) != null;

  void download(Track t) {
    final job = jobs[t.id];
    if (isDownloaded(t.id)) return;
    if (job != null && job.stage != Stage.error && job.stage != Stage.done) return;
    jobs[t.id] = DownloadJob(t);
    notifyListeners();
    _pump();
  }

  void downloadMany(List<Track> list) {
    final fresh = list.where((t) => !isDownloaded(t.id)).toList();
    for (final t in fresh) {
      download(t);
    }
    if (fresh.length > 1) _toasts.show('В очереди на скачивание: ${fresh.length}');
  }

  void cancel(String id) {
    engine.cancel(id);
    jobs.remove(id);
    notifyListeners();
    _pump();
  }

  Future<void> remove(String id) async {
    final t = get(id);
    if (t != null) await engine.deleteFile(t.filePath).catchError((_) {});
    tracks = tracks.where((x) => x.track.id != id).toList();
    notifyListeners();
    _save();
  }

  void clearFinished() {
    jobs.removeWhere((_, j) => j.stage == Stage.done || j.stage == Stage.error);
    notifyListeners();
  }

  void _pump() {
    final running = jobs.values.where((j) => j.running).length;
    final queued = jobs.values.where((j) => j.stage == Stage.queued).toList()..sort((a, b) => a.startedAt.compareTo(b.startedAt));
    for (final j in queued.take((_maxParallel - running).clamp(0, _maxParallel))) {
      _run(j);
    }
  }

  Future<void> _run(DownloadJob job) async {
    final t = job.track;
    job.stage = Stage.resolving;
    notifyListeners();
    try {
      final lyricsFuture = services.getLyrics(t);
      final result = await engine.download(
        DownloadRequest(
          src: sourceRequest(t, _settings.cookiesBrowser),
          id: t.id,
          title: t.title,
          artist: t.artist.name,
          album: t.album,
          format: _settings.format,
          dir: musicDir,
        ),
        (p) {
          if (jobs[t.id] != job) return;
          job
            ..stage = p.stage
            ..progress = p.progress
            ..speed = p.speed
            ..eta = p.eta;
          notifyListeners();
        },
      );
      final lyrics = await lyricsFuture;
      tracks = [
        LocalTrack(
          track: t,
          filePath: result.filePath,
          format: result.format,
          downloadedAt: DateTime.now(),
          syncedLyrics: lyrics?.synced,
          plainLyrics: lyrics?.plain,
        ),
        ...tracks.where((x) => x.track.id != t.id),
      ];
      job
        ..stage = Stage.done
        ..progress = 1;
      _save();
      services.syncDownload(t);
    } catch (e) {
      _fail(job, e);
    } finally {
      notifyListeners();
      _pump();
    }
  }

  void _fail(DownloadJob job, Object e) {
    if (e is Cancelled || jobs[job.track.id] != job) return;
    job
      ..stage = Stage.error
      ..error = '$e';
    _toasts.show('Не скачалось: ${job.track.title}. $e', ToastKind.error);
  }
}
