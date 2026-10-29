/// Example catalog for the design prototype and UI work. Not real API data.
/// Covers are `gen:` URLs that the Cover widget paints from the seed.
library;

import 'models.dart';

const user = User(id: 'u1', name: 'Max', username: 'phexuss');

const _artistList = [
  ('a1', 'Daft Punk'),
  ('a2', 'Radiohead'),
  ('a3', 'Земфира'),
  ('a4', 'Tame Impala'),
  ('a5', 'Massive Attack'),
  ('a6', 'Кино'),
  ('a7', 'Burial'),
  ('a8', 'Björk'),
];

final artists = [for (final (id, name) in _artistList) ArtistCard(id: id, name: name, pictureUrl: 'gen:artist $name')];

const _albumList = [
  ('al1', 'Discovery', 'a1', '2001'),
  ('al2', 'In Rainbows', 'a2', '2007'),
  ('al3', 'Вендетта', 'a3', '2005'),
  ('al4', 'Currents', 'a4', '2015'),
  ('al5', 'Mezzanine', 'a5', '1998'),
  ('al6', 'Группа крови', 'a6', '1988'),
  ('al7', 'Untrue', 'a7', '2007'),
  ('al8', 'Homogenic', 'a8', '1997'),
  ('al9', 'Random Access Memories', 'a1', '2013'),
  ('al10', 'OK Computer', 'a2', '1997'),
];

ArtistCard _artist(String id) => artists.firstWhere((a) => a.id == id);

final albums = [
  for (final (id, title, artistId, year) in _albumList)
    (card: AlbumCard(id: id, title: title, coverUrl: 'gen:$title', artistName: _artist(artistId).name, year: year), artistId: artistId),
];

const _raw = [
  ('One More Time', 'a1', 'al1', 320),
  ('Digital Love', 'a1', 'al1', 301),
  ('Harder, Better, Faster, Stronger', 'a1', 'al1', 224),
  ('Something About Us', 'a1', 'al1', 232),
  ('Weird Fishes/Arpeggi', 'a2', 'al2', 318),
  ('Reckoner', 'a2', 'al2', 290),
  ('Nude', 'a2', 'al2', 255),
  ('House of Cards', 'a2', 'al2', 328),
  ('Хочешь?', 'a3', 'al3', 213),
  ('Небомореоблака', 'a3', 'al3', 245),
  ('Let It Happen', 'a4', 'al4', 467),
  ('The Less I Know the Better', 'a4', 'al4', 216),
  ('Eventually', 'a4', 'al4', 318),
  ('Teardrop', 'a5', 'al5', 329),
  ('Angel', 'a5', 'al5', 379),
  ('Группа крови', 'a6', 'al6', 286),
  ('Спокойная ночь', 'a6', 'al6', 366),
  ('Archangel', 'a7', 'al7', 239),
  ('Near Dark', 'a7', 'al7', 233),
  ('Jóga', 'a8', 'al8', 305),
  ('Bachelorette', 'a8', 'al8', 316),
  ('Instant Crush', 'a1', 'al9', 337),
  ('Get Lucky', 'a1', 'al9', 369),
  ('Paranoid Android', 'a2', 'al10', 387),
];

final tracks = [
  for (final (i, (title, artistId, albumId, dur)) in _raw.indexed)
    () {
      final a = _artist(artistId);
      final al = albums.firstWhere((x) => x.card.id == albumId).card;
      return Track(
        id: 't${i + 1}',
        title: title,
        artist: Artist(id: a.id, name: a.name),
        album: al.title,
        albumId: al.id,
        coverUrl: al.coverUrl,
        durationSec: dur,
        isrc: 'GBXXX07000${i.toString().padLeft(2, '0')}',
        source: Source.deezer,
      );
    }(),
];

final scTracks = [
  for (final (i, (title, uploader, d)) in const [
    ('Burial — Untrue (live edit)', 'hyperdub-fan', 412),
    ('Night drive mix 03', 'phexuss', 3620),
    ('Teardrop (dub bootleg)', 'bristol_tapes', 371),
    ('Daft Punk tribute set', 'robot_rock', 2890),
  ].indexed)
    Track(
      id: 'sc_$i',
      title: title,
      artist: Artist(id: uploader, name: uploader),
      durationSec: d,
      coverUrl: 'gen:$title',
      isrc: 'https://soundcloud.com/$uploader/track-$i',
      source: Source.soundcloud,
    ),
];

Future<T> delay<T>(T v, [int ms = 350]) => Future.delayed(Duration(milliseconds: ms), () => v);

const lrc = '''[00:00.00]
[00:04.20]Это пример синхронного текста
[00:08.10]Строки подсвечиваются по времени
[00:12.40]Колесо мыши листает текст
[00:16.80]Клик по строке перематывает трек
[00:21.30]На компьютере текст живёт справа
[00:25.90]Рядом с очередью, а не поверх неё
[00:30.20]
[00:33.00]Настоящий текст приходит из LRCLIB
[00:37.50]Через тот же API, что и у телефона
[00:42.00]И сохраняется вместе с треком
[00:46.40]Чтобы работать без сети''';
