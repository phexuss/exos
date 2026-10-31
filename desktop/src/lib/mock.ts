/** Example catalog for the design prototype and browser dev. Not real API data. */
import type {
  AlbumCard,
  AlbumDetail,
  ArtistDetails,
  Chart,
  LrcLibEntry,
  Lyrics,
  SimilarTrack,
  Track,
  User,
} from './types';
import { generatedCover } from './art';

export const user: User = { id: 'u1', name: 'Max', username: 'phexuss', email: 'max@example.com' };

const ARTIST_LIST: ArtistDetails[] = [
  { id: 'a1', name: 'Daft Punk' },
  { id: 'a2', name: 'Radiohead' },
  { id: 'a3', name: 'Земфира' },
  { id: 'a4', name: 'Tame Impala' },
  { id: 'a5', name: 'Massive Attack' },
  { id: 'a6', name: 'Кино' },
  { id: 'a7', name: 'Burial' },
  { id: 'a8', name: 'Björk' },
];

const ARTISTS: ArtistDetails[] = ARTIST_LIST.map((a) => ({ ...a, pictureUrl: generatedCover(`artist ${a.name}`, 400) }));

const ALBUM_LIST: (AlbumCard & { artistId: string })[] = [
  { id: 'al1', title: 'Discovery', artistName: 'Daft Punk', artistId: 'a1', year: '2001' },
  { id: 'al2', title: 'In Rainbows', artistName: 'Radiohead', artistId: 'a2', year: '2007' },
  { id: 'al3', title: 'Вендетта', artistName: 'Земфира', artistId: 'a3', year: '2005' },
  { id: 'al4', title: 'Currents', artistName: 'Tame Impala', artistId: 'a4', year: '2015' },
  { id: 'al5', title: 'Mezzanine', artistName: 'Massive Attack', artistId: 'a5', year: '1998' },
  { id: 'al6', title: 'Группа крови', artistName: 'Кино', artistId: 'a6', year: '1988' },
  { id: 'al7', title: 'Untrue', artistName: 'Burial', artistId: 'a7', year: '2007' },
  { id: 'al8', title: 'Homogenic', artistName: 'Björk', artistId: 'a8', year: '1997' },
  { id: 'al9', title: 'Random Access Memories', artistName: 'Daft Punk', artistId: 'a1', year: '2013' },
  { id: 'al10', title: 'OK Computer', artistName: 'Radiohead', artistId: 'a2', year: '1997' },
];

const ALBUMS = ALBUM_LIST.map((a) => ({ ...a, coverUrl: generatedCover(a.title) }));

const RAW: [string, string, string, number][] = [
  ['One More Time', 'a1', 'al1', 320],
  ['Digital Love', 'a1', 'al1', 301],
  ['Harder, Better, Faster, Stronger', 'a1', 'al1', 224],
  ['Something About Us', 'a1', 'al1', 232],
  ['Weird Fishes/Arpeggi', 'a2', 'al2', 318],
  ['Reckoner', 'a2', 'al2', 290],
  ['Nude', 'a2', 'al2', 255],
  ['House of Cards', 'a2', 'al2', 328],
  ['Хочешь?', 'a3', 'al3', 213],
  ['Небомореоблака', 'a3', 'al3', 245],
  ['Let It Happen', 'a4', 'al4', 467],
  ['The Less I Know the Better', 'a4', 'al4', 216],
  ['Eventually', 'a4', 'al4', 318],
  ['Teardrop', 'a5', 'al5', 329],
  ['Angel', 'a5', 'al5', 379],
  ['Группа крови', 'a6', 'al6', 286],
  ['Спокойная ночь', 'a6', 'al6', 366],
  ['Archangel', 'a7', 'al7', 239],
  ['Near Dark', 'a7', 'al7', 233],
  ['Jóga', 'a8', 'al8', 305],
  ['Bachelorette', 'a8', 'al8', 316],
  ['Instant Crush', 'a1', 'al9', 337],
  ['Get Lucky', 'a1', 'al9', 369],
  ['Paranoid Android', 'a2', 'al10', 387],
];

const TRACKS: Track[] = RAW.map(([title, artistId, albumId, durationSec], i) => {
  const artist = ARTISTS.find((a) => a.id === artistId)!;
  const album = ALBUMS.find((a) => a.id === albumId)!;
  return {
    id: `t${i + 1}`,
    title,
    artist: { id: artist.id, name: artist.name },
    album: album.title,
    albumId: album.id,
    coverUrl: album.coverUrl,
    durationSec,
    isrc: `GBXXX07000${String(i).padStart(2, '0')}`,
    source: 'deezer',
  };
});

const SC_TRACKS: Track[] = [
  ['Burial — Untrue (live edit)', 'hyperdub-fan', 412],
  ['Night drive mix 03', 'phexuss', 3620],
  ['Teardrop (dub bootleg)', 'bristol_tapes', 371],
  ['Daft Punk tribute set', 'robot_rock', 2890],
].map(([title, uploader, d], i) => ({
  id: `sc_${i}`,
  title: String(title),
  artist: { id: String(uploader), name: String(uploader) },
  durationSec: Number(d),
  coverUrl: generatedCover(String(title), 400),
  isrc: `https://soundcloud.com/${uploader}/track-${i}`,
  source: 'soundcloud' as const,
}));

const delay = <T>(v: T, ms = 350) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export const exampleTracks = TRACKS;

export function chart(): Promise<Chart> {
  return delay({ tracks: TRACKS.slice(0, 20), albums: ALBUMS.slice(0, 8), artists: ARTISTS });
}

export function search(q: string, source: Track['source']): Promise<Track[]> {
  const needle = q.trim().toLowerCase();
  const pool = source === 'deezer' ? TRACKS : SC_TRACKS;
  const hits = pool.filter(
    (t) =>
      t.title.toLowerCase().includes(needle) ||
      t.artist.name.toLowerCase().includes(needle) ||
      t.album?.toLowerCase().includes(needle),
  );
  return delay(hits.length ? hits : pool.slice(0, 8));
}

export function artist(id: string): Promise<ArtistDetails> {
  return delay(ARTISTS.find((a) => a.id === id) ?? ARTISTS[0]);
}

export function artistTracks(id: string): Promise<Track[]> {
  return delay(TRACKS.filter((t) => t.artist.id === id));
}

export function artistAlbums(id: string): Promise<AlbumCard[]> {
  return delay(ALBUMS.filter((a) => a.artistId === id));
}

export function album(id: string): Promise<AlbumDetail> {
  const a = ALBUMS.find((x) => x.id === id) ?? ALBUMS[0];
  return delay({ ...a, tracks: TRACKS.filter((t) => t.albumId === a.id) });
}

export function similar(track: Track): Promise<SimilarTrack[]> {
  return delay(
    TRACKS.filter((t) => t.id !== track.id)
      .slice(4, 14)
      .map((t, i) => ({ ...t, match: 1 - i * 0.07 })),
  );
}

export function recent(): Promise<Track[]> {
  return delay([TRACKS[4], TRACKS[13], TRACKS[10], TRACKS[8], TRACKS[17], TRACKS[0], TRACKS[19]]);
}

const LRC = `[00:00.00]
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
[00:46.40]Чтобы работать без сети`;

export function lyrics(_track: Track): Promise<Lyrics> {
  return delay({ syncedLyrics: LRC, plainLyrics: null });
}

export function lrclib(q: string): Promise<LrcLibEntry[]> {
  const plain = LRC.split('\n')
    .map((l) => l.replace(/\[[^\]]*\]/g, ''))
    .join('\n')
    .trim();
  return delay([
    { id: 1, trackName: q, artistName: 'Radiohead', albumName: 'In Rainbows', duration: 318, syncedLyrics: LRC, plainLyrics: plain },
    { id: 2, trackName: `${q} (Live)`, artistName: 'Radiohead', albumName: 'Live', duration: 334, syncedLyrics: null, plainLyrics: plain },
    { id: 3, trackName: q, artistName: 'Someone Else', albumName: null, duration: 201, syncedLyrics: null, plainLyrics: 'Другая песня\nс тем же названием' },
  ]);
}
