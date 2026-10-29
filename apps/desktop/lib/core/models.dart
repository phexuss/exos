enum Source { deezer, soundcloud }

class Artist {
  const Artist({required this.id, required this.name});
  final String id;
  final String name;
}

class Track {
  const Track({
    required this.id,
    required this.title,
    required this.artist,
    required this.durationSec,
    required this.source,
    this.album,
    this.albumId,
    this.coverUrl,
    this.previewUrl,
    this.isrc,
  });

  final String id;
  final String title;
  final Artist artist;
  final String? album;
  final String? albumId;
  final int durationSec;
  final String? coverUrl;
  final String? previewUrl;

  /// ISRC for Deezer tracks, the track page URL for SoundCloud ones.
  final String? isrc;
  final Source source;

  /// What artwork placeholders and generated covers are seeded with.
  String get seed => album ?? id;

  Map<String, Object?> toJson() => {
    'id': id,
    'title': title,
    'artist': {'id': artist.id, 'name': artist.name},
    'album': album,
    'albumId': albumId,
    'durationSec': durationSec,
    'coverUrl': coverUrl,
    'previewUrl': previewUrl,
    'isrc': isrc,
    'source': source.name,
  };

  static Track fromJson(Map<String, Object?> j) {
    final a = (j['artist'] as Map?)?.cast<String, Object?>() ?? const {};
    return Track(
      id: j['id'] as String,
      title: j['title'] as String? ?? '',
      artist: Artist(id: a['id'] as String? ?? '', name: a['name'] as String? ?? ''),
      album: j['album'] as String?,
      albumId: j['albumId'] as String?,
      durationSec: (j['durationSec'] as num?)?.toInt() ?? 0,
      coverUrl: j['coverUrl'] as String?,
      previewUrl: j['previewUrl'] as String?,
      isrc: j['isrc'] as String?,
      source: j['source'] == 'soundcloud' ? Source.soundcloud : Source.deezer,
    );
  }
}

/// A track saved to disk, with the lyrics fetched when it was downloaded.
class LocalTrack {
  const LocalTrack({
    required this.track,
    required this.filePath,
    required this.format,
    required this.downloadedAt,
    this.syncedLyrics,
    this.plainLyrics,
  });

  final Track track;
  final String filePath;
  final String format;
  final DateTime downloadedAt;
  final String? syncedLyrics;
  final String? plainLyrics;

  Map<String, Object?> toJson() => {
    ...track.toJson(),
    'filePath': filePath,
    'format': format,
    'downloadedAt': downloadedAt.millisecondsSinceEpoch,
    'syncedLyrics': syncedLyrics,
    'plainLyrics': plainLyrics,
  };

  static LocalTrack fromJson(Map<String, Object?> j) => LocalTrack(
    track: Track.fromJson(j),
    filePath: j['filePath'] as String,
    format: j['format'] as String? ?? '',
    downloadedAt: DateTime.fromMillisecondsSinceEpoch((j['downloadedAt'] as num?)?.toInt() ?? 0),
    syncedLyrics: j['syncedLyrics'] as String?,
    plainLyrics: j['plainLyrics'] as String?,
  );
}

class AlbumCard {
  const AlbumCard({required this.id, required this.title, this.coverUrl, this.artistName, this.year});
  final String id;
  final String title;
  final String? coverUrl;
  final String? artistName;
  final String? year;
}

class ArtistCard {
  const ArtistCard({required this.id, required this.name, this.pictureUrl, this.fans, this.albumsCount});
  final String id;
  final String name;
  final String? pictureUrl;
  final int? fans;
  final int? albumsCount;
}

class AlbumDetail {
  const AlbumDetail({required this.card, required this.artistId, required this.tracks});
  final AlbumCard card;
  final String artistId;
  final List<Track> tracks;
}

class Chart {
  const Chart({required this.tracks, required this.albums, required this.artists});
  final List<Track> tracks;
  final List<AlbumCard> albums;
  final List<ArtistCard> artists;
}

class Lyrics {
  const Lyrics({this.synced, this.plain});
  final String? synced;
  final String? plain;
  bool get isEmpty => (synced == null || synced!.isEmpty) && (plain == null || plain!.isEmpty);
}

class User {
  const User({required this.id, required this.name, required this.username});
  final String id;
  final String name;
  final String username;
}

class LyricLine {
  const LyricLine(this.time, this.text);
  final double time;
  final String text;
}

/// "[01:23.45] words" lines into timed lines, sorted.
List<LyricLine> parseLrc(String lrc) {
  final out = <LyricLine>[];
  final stamp = RegExp(r'\[(\d+):(\d+(?:\.\d+)?)\]');
  for (final raw in lrc.split('\n')) {
    final stamps = stamp.allMatches(raw).toList();
    if (stamps.isEmpty) continue;
    final text = raw.substring(stamps.last.end).trim();
    for (final m in stamps) {
      out.add(LyricLine(int.parse(m[1]!) * 60 + double.parse(m[2]!), text));
    }
  }
  out.sort((a, b) => a.time.compareTo(b.time));
  return out;
}

int activeLine(List<LyricLine> lines, double t) {
  var lo = 0, hi = lines.length - 1, found = -1;
  while (lo <= hi) {
    final mid = (lo + hi) >> 1;
    if (lines[mid].time <= t + 0.15) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}
