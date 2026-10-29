import '../core/models.dart';
import '../core/prefs.dart';

class ToolInfo {
  const ToolInfo({required this.path, required this.version, required this.managed, this.name});
  final String path;
  final String version;

  /// Installed by EXØS into its own folder, and so updatable by it.
  final bool managed;

  /// For the JS runtime: deno, node or bun.
  final String? name;
}

enum Tool { ytdlp, ffmpeg, deno }

class EngineStatus {
  const EngineStatus({
    required this.ytdlp,
    required this.ffmpeg,
    required this.jsRuntime,
    required this.musicDir,
    required this.dataDir,
    required this.installable,
  });
  final ToolInfo? ytdlp;
  final ToolInfo? ffmpeg;

  /// yt-dlp needs one to solve YouTube's JS challenges.
  final ToolInfo? jsRuntime;
  final String musicDir;
  final String dataDir;

  /// Which tools this platform can download by itself.
  final Set<Tool> installable;
}

class SourceRequest {
  const SourceRequest({required this.query, required this.source, this.isrc, this.cookiesBrowser});
  final String query;
  final String? isrc;
  final Source source;
  final String? cookiesBrowser;
}

/// A URL mpv can open, with the headers the CDN wants. `sourceUrl` is the
/// YouTube video a search landed on, remembered to skip the search next time.
class ResolvedStream {
  const ResolvedStream({required this.url, this.headers = const {}, this.sourceUrl, this.expires});
  final String url;
  final Map<String, String> headers;
  final String? sourceUrl;

  /// When the CDN stops honouring the link; null for files on disk.
  final DateTime? expires;
}

class DownloadRequest {
  const DownloadRequest({
    required this.src,
    required this.id,
    required this.title,
    required this.artist,
    required this.format,
    required this.dir,
    this.album,
  });
  final SourceRequest src;
  final String id;
  final String title;
  final String artist;
  final String? album;
  final String format;
  final String dir;
}

enum Stage { queued, resolving, downloading, converting, done, error }

class DownloadProgress {
  const DownloadProgress(this.stage, this.progress, {this.speed, this.eta, this.error});
  final Stage stage;
  final double progress;
  final String? speed;
  final String? eta;
  final String? error;
}

class Downloaded {
  const Downloaded(this.filePath, this.format);
  final String filePath;
  final String format;
}

class CookieCheck {
  const CookieCheck({required this.count, required this.youtube, required this.signedIn});
  final int count;
  final int youtube;
  final bool signedIn;
}

class Cancelled implements Exception {
  @override
  String toString() => 'отменено';
}

/* ---------- which YouTube video a track resolved to ---------- */

const _sourcesKey = 'exos.sourceUrls';
const _sourcesMax = 3000;
Map<String, String>? _sources;

Map<String, String> _loadSources() {
  if (_sources != null) return _sources!;
  final raw = Prefs.str(_sourcesKey);
  final out = <String, String>{};
  if (raw != null) {
    for (final line in raw.split('\n')) {
      final i = line.indexOf('\t');
      if (i > 0) out[line.substring(0, i)] = line.substring(i + 1);
    }
  }
  return _sources = out;
}

/// Searching is the slow half of a resolve, so remember where a track landed.
void rememberSource(String trackId, String? url) {
  final map = _loadSources();
  if (url == null) {
    map.remove(trackId);
  } else {
    map.remove(trackId);
    map[trackId] = url;
  }
  while (map.length > _sourcesMax) {
    map.remove(map.keys.first);
  }
  Prefs.set(_sourcesKey, [for (final e in map.entries) '${e.key}\t${e.value}'].join('\n'));
}

String? rememberedSource(String trackId) => _loadSources()[trackId];

SourceRequest sourceRequest(Track t, String? cookiesBrowser) {
  final scUrl = t.source == Source.soundcloud && (t.isrc?.startsWith('http') ?? false) ? t.isrc : null;
  final known = scUrl == null ? rememberedSource(t.id) : null;
  return SourceRequest(
    query: scUrl ?? known ?? '${t.artist.name} ${t.title}',
    isrc: scUrl != null || known != null ? null : t.isrc,
    source: t.source,
    cookiesBrowser: (cookiesBrowser?.isEmpty ?? true) ? null : cookiesBrowser,
  );
}
