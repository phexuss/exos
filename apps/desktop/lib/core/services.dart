import 'api.dart';
import 'env.dart';
import 'format.dart';
import 'mock.dart' as mock;
import 'models.dart';

typedef Json = Map<String, Object?>;

Json _m(Object? o) => (o as Map).cast<String, Object?>();
List<Json> _list(Object? o) => [for (final e in (o as List? ?? const [])) _m(e)];
String? _s(Object? o) => o == null ? null : '$o';

AlbumCard _album(Json a) => AlbumCard(
  id: '${a['id']}',
  title: a['title'] as String? ?? '',
  coverUrl: _s(a['cover_big'] ?? a['cover_medium']),
  artistName: (a['artist'] as Map?)?['name'] as String?,
  year: (a['release_date'] as String?)?.substring(0, 4),
);

ArtistCard _artist(Json a) => ArtistCard(
  id: '${a['id']}',
  name: a['name'] as String? ?? '',
  pictureUrl: _s(a['picture_xl'] ?? a['picture_big'] ?? a['picture_medium']),
  fans: (a['nb_fan'] as num?)?.toInt(),
  albumsCount: (a['nb_album'] as num?)?.toInt(),
);

Track _dzTrack(Json t, [Json? album]) {
  final a = t['album'] == null ? album : _m(t['album']);
  final artist = _m(t['artist']);
  return Track(
    id: '${t['id']}',
    title: t['title'] as String? ?? '',
    artist: Artist(id: '${artist['id']}', name: artist['name'] as String? ?? ''),
    album: a?['title'] as String?,
    albumId: a == null ? null : '${a['id']}',
    durationSec: (t['duration'] as num?)?.toInt() ?? 0,
    coverUrl: a == null ? null : _s(a['cover_big'] ?? a['cover_medium']),
    previewUrl: t['preview'] as String?,
    isrc: t['isrc'] as String?,
    source: Source.deezer,
  );
}

Track _scTrack(Json sc) {
  final thumbs = _list(sc['thumbnails']);
  Json? thumb;
  for (final t in thumbs) {
    if (t['resolution'] == 't500x500' || t['resolution'] == 'original') thumb = t;
  }
  thumb ??= thumbs.isEmpty ? null : thumbs.last;
  final uploader = sc['uploader'] as String? ?? '';
  final uploaderId = sc['uploader_id'] as String?;
  return Track(
    id: 'sc_${sc['id']}',
    title: sc['title'] as String? ?? '',
    artist: Artist(id: (uploaderId == null || uploaderId.isEmpty) ? uploader : uploaderId, name: uploader),
    durationSec: (sc['duration'] as num?)?.toInt() ?? 0,
    coverUrl: thumb?['url'] as String?,
    isrc: sc['webpage_url'] as String?,
    source: Source.soundcloud,
  );
}

/* ---------- auth ---------- */

Future<void> login(String username, String password) async {
  if (kMock) return;
  final t = _m(await apiRequest('/auth/login', method: 'POST', body: {'username': username, 'password': password}, skipAuth: true));
  saveTokens(t['accessToken'] as String, t['refreshToken'] as String);
}

Future<void> logout() async {
  if (!kMock) {
    try {
      final token = refreshToken();
      if (token != null) await apiRequest('/auth/logout', method: 'POST', body: {'refreshToken': token});
    } catch (_) {}
  }
  clearTokens();
}

Future<User> getMe() async {
  if (kMock) return mock.user;
  final u = _m(await apiGet('/user/me'));
  return User(id: '${u['id']}', name: u['name'] as String? ?? '', username: u['username'] as String? ?? '');
}

/* ---------- catalog ---------- */

Future<Chart> getChart() async {
  if (kMock) {
    return mock.delay(
      Chart(tracks: mock.tracks.take(20).toList(), albums: [for (final a in mock.albums.take(8)) a.card], artists: mock.artists),
    );
  }
  final raw = _m(await apiGet('/search/chart'));
  return Chart(
    tracks: [for (final t in _list(_m(raw['tracks'])['data'])) _dzTrack(t)],
    albums: [for (final a in _list(_m(raw['albums'])['data'])) _album(a)],
    artists: [for (final a in _list(_m(raw['artists'])['data'])) _artist(a)],
  );
}

List<Track> _mockSearch(String q, List<Track> pool) {
  final needle = q.trim().toLowerCase();
  final hits = pool
      .where(
        (t) =>
            t.title.toLowerCase().contains(needle) ||
            t.artist.name.toLowerCase().contains(needle) ||
            (t.album?.toLowerCase().contains(needle) ?? false),
      )
      .toList();
  return hits.isEmpty ? pool.take(8).toList() : hits;
}

Future<List<Track>> searchDeezer(String q) async {
  if (kMock) return mock.delay(_mockSearch(q, mock.tracks));
  final raw = _m(await apiGet('/search', {'q': q}));
  return [for (final t in _list(raw['data'])) _dzTrack(t)];
}

Future<List<Track>> searchSoundCloud(String q) async {
  if (kMock) return mock.delay(_mockSearch(q, mock.scTracks));
  final raw = _m(await apiGet('/search/soundcloud', {'q': q}));
  return [for (final t in _list(raw['data'])) _scTrack(t)];
}

Future<ArtistCard> getArtist(String id) async {
  if (kMock) return mock.delay(mock.artists.firstWhere((a) => a.id == id, orElse: () => mock.artists.first));
  return _artist(_m(await apiGet('/artists/$id')));
}

Future<List<Track>> getArtistTracks(String id) async {
  if (kMock) return mock.delay(mock.tracks.where((t) => t.artist.id == id).toList());
  return [for (final t in _list(_m(await apiGet('/artists/$id/tracks'))['data'])) _dzTrack(t)];
}

Future<List<AlbumCard>> getArtistAlbums(String id) async {
  if (kMock) {
    return mock.delay([
      for (final a in mock.albums)
        if (a.artistId == id) a.card,
    ]);
  }
  return [for (final a in _list(_m(await apiGet('/artists/$id/albums'))['data'])) _album(a)];
}

Future<AlbumDetail> getAlbum(String id) async {
  if (kMock) {
    final a = mock.albums.firstWhere((x) => x.card.id == id, orElse: () => mock.albums.first);
    return mock.delay(AlbumDetail(card: a.card, artistId: a.artistId, tracks: mock.tracks.where((t) => t.albumId == a.card.id).toList()));
  }
  final raw = _m(await apiGet('/albums/$id'));
  final tracks = raw['tracks'] == null ? const <Json>[] : _list(_m(raw['tracks'])['data']);
  return AlbumDetail(
    card: _album(raw),
    artistId: '${(raw['artist'] as Map?)?['id'] ?? ''}',
    tracks: [for (final t in tracks) _dzTrack(t, raw)],
  );
}

Future<List<Track>> getSimilar(Track track) async {
  if (kMock) return mock.delay(mock.tracks.where((t) => t.id != track.id).skip(4).take(10).toList());
  final raw = _list(await apiGet('/search/similar', {'artist': primaryArtist(track.artist.name), 'track': track.title}));
  return [
    for (final s in raw)
      Track(
        id: '${s['deezerId']}',
        title: s['title'] as String? ?? '',
        artist: Artist(id: '', name: s['artist'] as String? ?? ''),
        durationSec: (s['duration'] as num?)?.toInt() ?? 0,
        coverUrl: s['coverUrl'] as String?,
        isrc: s['isrc'] as String?,
        source: Source.deezer,
      ),
  ];
}

Future<Lyrics?> getLyrics(Track track) async {
  if (kMock) return mock.delay(const Lyrics(synced: mock.lrc));
  try {
    final raw = _m(
      await apiGet('/lyrics', {'artist': primaryArtist(track.artist.name), 'track': track.title, 'duration': track.durationSec}),
    );
    return Lyrics(synced: raw['syncedLyrics'] as String?, plain: raw['plainLyrics'] as String?);
  } catch (_) {
    return null;
  }
}

/* ---------- cloud library (shared with the phone app) ---------- */

Json _toCloud(Track t, {DateTime? addedAt, DateTime? playedAt}) => {
  'trackId': t.id,
  'deezerId': t.source == Source.deezer ? t.id : null,
  'scUrl': t.source == Source.soundcloud ? t.isrc : null,
  'source': t.source.name,
  'title': t.title,
  'artistName': t.artist.name,
  'artistId': t.artist.id.isEmpty ? null : t.artist.id,
  'album': t.album,
  'coverUrl': t.coverUrl,
  'duration': '${t.durationSec ~/ 60}:${(t.durationSec % 60).toString().padLeft(2, '0')}',
  'durationSec': t.durationSec,
  'previewUrl': t.previewUrl,
  'isrc': t.isrc,
  'addedAt': addedAt?.toUtc().toIso8601String(),
  'playedAt': playedAt?.toUtc().toIso8601String(),
}..removeWhere((_, v) => v == null);

void syncDownload(Track t) {
  if (kMock) return;
  apiRequest(
    '/library/downloads',
    method: 'POST',
    body: _toCloud(t, addedAt: DateTime.now()),
  ).catchError((_) => null);
}

void syncPlayed(Track t) {
  if (kMock) return;
  apiRequest(
    '/library/recent',
    method: 'POST',
    body: _toCloud(t, playedAt: DateTime.now()),
  ).catchError((_) => null);
}

Future<List<Track>> getCloudRecent() async {
  if (kMock) {
    return mock.delay([
      for (final i in const [4, 13, 10, 8, 17, 0, 19]) mock.tracks[i],
    ]);
  }
  final raw = _list(await apiGet('/library/recent', {'limit': 30}));
  return [
    for (final c in raw)
      Track(
        id: _s(c['trackId'] ?? c['deezerId'] ?? c['scUrl'] ?? c['title'])!,
        title: c['title'] as String? ?? '',
        artist: Artist(id: c['artistId'] as String? ?? '', name: c['artistName'] as String? ?? ''),
        album: c['album'] as String?,
        durationSec: (c['durationSec'] as num?)?.toInt() ?? 0,
        coverUrl: c['coverUrl'] as String?,
        previewUrl: c['previewUrl'] as String?,
        isrc: _s(c['isrc'] ?? c['scUrl']),
        source: c['source'] == 'soundcloud' || (c['deezerId'] == null && c['scUrl'] != null) ? Source.soundcloud : Source.deezer,
      ),
  ];
}
