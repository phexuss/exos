import { apiGet, apiPost, apiRequest, clearTokens, saveTokens } from './api';
import { call } from './bridge';
import { IS_DESKTOP, IS_MOCK } from './env';
import { primaryArtist } from './format';
import * as mock from './mock';
import type {
  AlbumCard,
  AlbumDetail,
  ArtistDetails,
  Chart,
  Lyrics,
  SimilarTrack,
  Track,
  User,
} from './types';

/** Seconds the engine may answer from disk before asking the API again. */
const TTL = {
  chart: 30 * 60,
  search: 10 * 60,
  catalogue: 24 * 3600,
  lyrics: 7 * 24 * 3600,
};

type DzArtist = {
  id: number;
  name: string;
  picture_medium?: string;
  picture_big?: string;
  picture_xl?: string;
  nb_fan?: number;
  nb_album?: number;
};
type DzAlbum = {
  id: number;
  title: string;
  cover_medium?: string;
  cover_big?: string;
  cover_xl?: string;
  release_date?: string;
  artist?: { id: number; name: string };
};
type DzTrack = {
  id: number;
  title: string;
  duration: number;
  preview?: string;
  isrc?: string;
  artist: { id: number; name: string };
  album?: DzAlbum;
};
type ScTrack = {
  id: string;
  title: string;
  uploader: string;
  uploader_id: string;
  duration: number;
  webpage_url: string;
  thumbnails?: { url: string; resolution?: string }[];
};

function mapDzTrack(t: DzTrack, album?: DzAlbum): Track {
  const a = t.album ?? album;
  return {
    id: String(t.id),
    title: t.title,
    artist: { id: String(t.artist.id), name: t.artist.name },
    album: a?.title,
    albumId: a ? String(a.id) : undefined,
    durationSec: t.duration,
    coverUrl: a?.cover_big ?? a?.cover_medium,
    previewUrl: t.preview,
    isrc: t.isrc,
    source: 'deezer',
  };
}

function mapDzAlbum(a: DzAlbum): AlbumCard {
  return {
    id: String(a.id),
    title: a.title,
    coverUrl: a.cover_big ?? a.cover_medium,
    artistName: a.artist?.name,
    year: a.release_date?.slice(0, 4),
  };
}

function mapDzArtist(a: DzArtist): ArtistDetails {
  return {
    id: String(a.id),
    name: a.name,
    pictureUrl: a.picture_xl ?? a.picture_big ?? a.picture_medium,
    fans: a.nb_fan,
    albumsCount: a.nb_album,
  };
}

function mapScTrack(sc: ScTrack): Track {
  const thumb =
    sc.thumbnails?.find((t) => t.resolution === 't500x500' || t.resolution === 'original') ??
    sc.thumbnails?.at(-1);
  return {
    id: `sc_${sc.id}`,
    title: sc.title,
    artist: { id: sc.uploader_id || sc.uploader, name: sc.uploader },
    durationSec: sc.duration,
    coverUrl: thumb?.url,
    isrc: sc.webpage_url,
    source: 'soundcloud',
  };
}

/* ---------- auth ---------- */

export async function login(username: string, password: string): Promise<void> {
  if (IS_MOCK) return;
  const tokens = await apiPost<{ accessToken: string; refreshToken: string }>(
    '/auth/login',
    { username, password },
    true,
  );
  saveTokens(tokens.accessToken, tokens.refreshToken);
}

export async function logout(): Promise<void> {
  if (!IS_MOCK) {
    try {
      const refreshToken = localStorage.getItem('exos.refreshToken');
      if (refreshToken) await apiPost('/auth/logout', { refreshToken });
    } catch {}
  }
  clearTokens();
}

export function getMe(): Promise<User> {
  if (IS_MOCK) return Promise.resolve(mock.user);
  return apiGet<User>('/user/me');
}

/* ---------- catalog ---------- */

export async function getChart(): Promise<Chart> {
  if (IS_MOCK) return mock.chart();
  const raw = await apiGet<{
    tracks: { data: DzTrack[] };
    albums: { data: DzAlbum[] };
    artists: { data: DzArtist[] };
  }>('/search/chart', undefined, TTL.chart);
  return {
    tracks: raw.tracks.data.map((t) => mapDzTrack(t)),
    albums: raw.albums.data.map(mapDzAlbum),
    artists: raw.artists.data.map(mapDzArtist),
  };
}

export async function searchDeezer(q: string): Promise<Track[]> {
  if (IS_MOCK) return mock.search(q, 'deezer');
  const raw = await apiGet<{ data: DzTrack[] }>('/search', { q }, TTL.search);
  return raw.data.map((t) => mapDzTrack(t));
}

export async function searchSoundCloud(q: string): Promise<Track[]> {
  if (IS_MOCK) return mock.search(q, 'soundcloud');
  const raw = await apiGet<{ data: ScTrack[] }>('/search/soundcloud', { q }, TTL.search);
  return raw.data.map(mapScTrack);
}

export async function getArtist(id: string): Promise<ArtistDetails> {
  if (IS_MOCK) return mock.artist(id);
  return mapDzArtist(await apiGet<DzArtist>(`/artists/${id}`, undefined, TTL.catalogue));
}

export async function getArtistTracks(id: string): Promise<Track[]> {
  if (IS_MOCK) return mock.artistTracks(id);
  const raw = await apiGet<{ data: DzTrack[] }>(`/artists/${id}/tracks`, undefined, TTL.catalogue);
  return raw.data.map((t) => mapDzTrack(t));
}

export async function getArtistAlbums(id: string): Promise<AlbumCard[]> {
  if (IS_MOCK) return mock.artistAlbums(id);
  const raw = await apiGet<{ data: DzAlbum[] }>(`/artists/${id}/albums`, undefined, TTL.catalogue);
  return raw.data.map(mapDzAlbum);
}

export async function getAlbum(id: string): Promise<AlbumDetail> {
  if (IS_MOCK) return mock.album(id);
  const raw = await apiGet<DzAlbum & { tracks?: { data: DzTrack[] } }>(`/albums/${id}`, undefined, TTL.catalogue);
  const card = mapDzAlbum(raw);
  return {
    ...card,
    artistId: String(raw.artist?.id ?? ''),
    tracks: (raw.tracks?.data ?? []).map((t) => mapDzTrack(t, raw)),
  };
}

export async function getSimilar(track: Track): Promise<SimilarTrack[]> {
  if (IS_MOCK) return mock.similar(track);
  const raw = await apiGet<
    {
      title: string;
      artist: string;
      match: number;
      coverUrl: string | null;
      duration: number | null;
      isrc: string | null;
      deezerId: number;
    }[]
  >('/search/similar', { artist: primaryArtist(track.artist.name), track: track.title }, TTL.catalogue);
  return raw.map((s) => ({
    id: String(s.deezerId),
    title: s.title,
    artist: { id: '', name: s.artist },
    durationSec: s.duration ?? 0,
    coverUrl: s.coverUrl ?? undefined,
    isrc: s.isrc ?? undefined,
    source: 'deezer',
    match: s.match,
  }));
}

type LrcLibHit = { duration: number; instrumental?: boolean } & Lyrics;

/**
 * LRCLIB's own search, when the server's exact match came back empty: the
 * match it picks by length can be an entry without text while another entry
 * of the same song has synced or at least plain lyrics.
 */
async function searchLrcLib(track: Track): Promise<Lyrics | null> {
  if (!IS_DESKTOP) return null;
  const q = new URLSearchParams({ artist_name: primaryArtist(track.artist.name), track_name: track.title });
  const r = await call<{ status: number; body: string }>('http', {
    req: { url: `https://lrclib.net/api/search?${q}`, ttl: TTL.lyrics },
  });
  if (r.status !== 200) return null;
  const hits = (JSON.parse(r.body) as LrcLibHit[]).filter((h) => h.syncedLyrics || h.plainLyrics);
  if (!hits.length) return null;
  const off = (h: LrcLibHit) => (track.durationSec ? Math.abs(h.duration - track.durationSec) : 0);
  // Synced first, then plain; among equals the one closest in length. Far-off lengths are other songs.
  const near = hits.filter((h) => off(h) <= 15);
  const pool = near.length ? near : hits;
  pool.sort((a, b) => Number(!a.syncedLyrics) - Number(!b.syncedLyrics) || off(a) - off(b));
  return { syncedLyrics: pool[0].syncedLyrics ?? null, plainLyrics: pool[0].plainLyrics ?? null };
}

export async function getLyrics(track: Track): Promise<Lyrics | null> {
  if (IS_MOCK) return mock.lyrics(track);
  let found: Lyrics | null = null;
  try {
    found = await apiGet<Lyrics>(
      '/lyrics',
      {
        artist: primaryArtist(track.artist.name),
        track: track.title,
        duration: track.durationSec,
      },
      TTL.lyrics,
    );
  } catch {}
  if (found?.syncedLyrics || found?.plainLyrics) return found;
  return (await searchLrcLib(track).catch(() => null)) ?? found;
}

/* ---------- cloud library (shared with the phone app) ---------- */

function toCloud(track: Track, stamp: { addedAt?: number; playedAt?: number }) {
  return {
    trackId: track.id,
    deezerId: track.source === 'deezer' ? track.id : undefined,
    scUrl: track.source === 'soundcloud' ? track.isrc : undefined,
    source: track.source,
    title: track.title,
    artistName: track.artist.name,
    artistId: track.artist.id || undefined,
    album: track.album,
    coverUrl: track.coverUrl,
    duration: `${Math.floor(track.durationSec / 60)}:${String(track.durationSec % 60).padStart(2, '0')}`,
    durationSec: track.durationSec,
    previewUrl: track.previewUrl,
    isrc: track.isrc,
    addedAt: stamp.addedAt ? new Date(stamp.addedAt).toISOString() : undefined,
    playedAt: stamp.playedAt ? new Date(stamp.playedAt).toISOString() : undefined,
  };
}

export function syncDownload(track: Track): void {
  if (IS_MOCK) return;
  apiRequest('/library/downloads', {
    method: 'POST',
    body: toCloud(track, { addedAt: Date.now() }),
  }).catch(() => {});
}

export function syncPlayed(track: Track): void {
  if (IS_MOCK) return;
  apiRequest('/library/recent', {
    method: 'POST',
    body: toCloud(track, { playedAt: Date.now() }),
  }).catch(() => {});
}

type CloudTrack = ReturnType<typeof toCloud>;

export async function getCloudRecent(): Promise<Track[]> {
  if (IS_MOCK) return mock.recent();
  const raw = await apiGet<CloudTrack[]>('/library/recent', { limit: 30 });
  return raw.map((c) => ({
    id: c.trackId ?? c.deezerId ?? c.scUrl ?? c.title,
    title: c.title,
    artist: { id: c.artistId ?? '', name: c.artistName },
    album: c.album,
    durationSec: c.durationSec,
    coverUrl: c.coverUrl,
    previewUrl: c.previewUrl,
    isrc: c.isrc ?? c.scUrl,
    source: c.source === 'soundcloud' || (!c.deezerId && c.scUrl) ? 'soundcloud' : 'deezer',
  }));
}
