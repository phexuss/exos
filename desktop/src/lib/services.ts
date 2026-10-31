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
  LocalTrack,
  LrcLibEntry,
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

/** Creates the account; the server mails a 6-digit code that `verifyEmail` takes. */
export async function register(input: {
  name: string;
  username: string;
  email: string;
  password: string;
}): Promise<{ userId: string; email: string }> {
  if (IS_MOCK) return { userId: 'u1', email: input.email };
  const user = await apiPost<{ id: string; email: string }>('/auth/register', input, true);
  return { userId: user.id, email: user.email };
}

/** A right code signs the new account in: the server answers with a token pair. */
export async function verifyEmail(userId: string, code: string): Promise<void> {
  if (IS_MOCK) return;
  const tokens = await apiPost<{ accessToken: string; refreshToken: string }>(
    '/auth/verify',
    { userId, code },
    true,
  );
  saveTokens(tokens.accessToken, tokens.refreshToken);
}

export async function resendCode(userId: string): Promise<void> {
  if (IS_MOCK) return;
  await apiPost('/auth/verify/resend', { userId }, true);
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

/** Free-text LRCLIB search for the lyrics editor, for when the automatic match picked the wrong song. */
export async function findLyrics(query: string): Promise<LrcLibEntry[]> {
  const q = query.trim();
  if (!q) return [];
  if (IS_MOCK) return mock.lrclib(q);
  const r = await call<{ status: number; body: string }>('http', {
    req: { url: `https://lrclib.net/api/search?${new URLSearchParams({ q })}`, ttl: TTL.lyrics },
  });
  if (r.status !== 200) throw new Error(`LRCLIB ${r.status}`);
  return (JSON.parse(r.body) as LrcLibEntry[]).filter((h) => h.syncedLyrics || h.plainLyrics || h.instrumental);
}

/* ---------- cloud library (shared with the phone app) ---------- */

/**
 * The server keeps the list of what an account downloaded, on every device,
 * not the audio. Field limits mirror apps/api/src/library/dto/library.dto.ts:
 * one record over a limit fails a whole bulk request, so long text is cut and
 * long URLs are left out.
 */
const cut = (s: string | undefined, max: number) => (s && s.length > max ? s.slice(0, max) : s);
const url = (s: string | undefined) => (s && s.length <= 2048 ? s : undefined);

function toCloud(track: Track, stamp: { addedAt?: number; playedAt?: number }) {
  const sec = Math.max(0, Math.round(track.durationSec || 0));
  return {
    trackId: cut(track.id, 256),
    deezerId: track.source === 'deezer' ? cut(track.id, 128) : undefined,
    scUrl: track.source === 'soundcloud' ? url(track.isrc) : undefined,
    source: track.source,
    title: cut(track.title, 240) || '—',
    artistName: cut(track.artist.name, 180) || '—',
    artistId: cut(track.artist.id || undefined, 128),
    album: cut(track.album, 240),
    coverUrl: url(track.coverUrl),
    duration: `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`,
    durationSec: sec,
    previewUrl: url(track.previewUrl),
    isrc: url(track.isrc),
    addedAt: stamp.addedAt ? new Date(stamp.addedAt).toISOString() : undefined,
    playedAt: stamp.playedAt ? new Date(stamp.playedAt).toISOString() : undefined,
  };
}

/** The server needs a Deezer id or a SoundCloud link to file a track under. */
const filable = (c: CloudTrack) => !!(c.deezerId || c.scUrl);

export function syncDownload(track: Track): void {
  if (IS_MOCK) return;
  const body = toCloud(track, { addedAt: Date.now() });
  if (!filable(body)) return;
  apiRequest('/library/downloads', { method: 'POST', body }).catch((e) => console.warn('[cloud] download not saved', e));
}

export function syncPlayed(track: Track): void {
  if (IS_MOCK) return;
  const body = toCloud(track, { playedAt: Date.now() });
  if (!filable(body)) return;
  apiRequest('/library/recent', { method: 'POST', body }).catch(() => {});
}

/** The server takes at most this many records per bulk request. */
const BULK_MAX = 500;

/** Files everything on this computer in the cloud; the server keeps the newest date per track. */
export async function pushDownloads(tracks: LocalTrack[]): Promise<void> {
  if (IS_MOCK) return;
  const all = tracks.map((t) => toCloud(t, { addedAt: t.downloadedAt })).filter(filable);
  for (let i = 0; i < all.length; i += BULK_MAX) {
    await apiPost('/library/downloads/bulk', { tracks: all.slice(i, i + BULK_MAX) });
  }
}

type CloudTrack = ReturnType<typeof toCloud>;

function fromCloud(c: CloudTrack): Track {
  return {
    id: c.trackId ?? c.deezerId ?? c.scUrl ?? c.title,
    title: c.title,
    artist: { id: c.artistId ?? '', name: c.artistName },
    album: c.album,
    durationSec: c.durationSec,
    coverUrl: c.coverUrl,
    previewUrl: c.previewUrl,
    isrc: c.isrc ?? c.scUrl,
    source: c.source === 'soundcloud' || (!c.deezerId && c.scUrl) ? 'soundcloud' : 'deezer',
  };
}

export async function getCloudRecent(): Promise<Track[]> {
  if (IS_MOCK) return mock.recent();
  const raw = await apiGet<CloudTrack[]>('/library/recent', { limit: 30 });
  return raw.map(fromCloud);
}

/** What the account downloaded on any device, newest first, with when. */
export async function getCloudDownloads(): Promise<{ track: Track; addedAt: number }[]> {
  // The preview's cloud overlaps its local library, so both states show.
  if (IS_MOCK) return mock.exampleTracks.slice(5, 16).map((track, i) => ({ track, addedAt: Date.now() - i * 86_400_000 }));
  const raw = await apiGet<CloudTrack[]>('/library/downloads', { limit: BULK_MAX });
  return raw.map((c) => ({ track: fromCloud(c), addedAt: c.addedAt ? Date.parse(c.addedAt) : 0 }));
}
