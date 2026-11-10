/**
 * SoundCloud search straight from the phone, through the same public web API
 * the site uses (api-v2 with the web client's id), like the desktop engine.
 * The EXØS server's search is only a fallback.
 */
import { File, Paths } from 'expo-file-system';

import type { SoundCloudTrack } from '@/types/soundcloud';

const API = 'https://api-v2.soundcloud.com';
const UA =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const TIMEOUT_MS = 15_000;

type Fetched = { status: number; ok: boolean; text: string };

/** GET with one timeout over headers and body (the body used to be unbounded). */
async function get(url: string): Promise<Fetched> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: controller.signal,
    });
    return { status: res.status, ok: res.ok, text: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

export function findClientId(js: string): string | null {
  const match = /client_id\s*[:=]\s*"([A-Za-z0-9]{32})"/.exec(js);
  return match ? match[1] : null;
}

/** The public web client's id, scraped from soundcloud.com's JS bundles. */
async function scrapeClientId(): Promise<string> {
  const res = await get('https://soundcloud.com/');
  if (!res.ok) throw new Error(`soundcloud.com HTTP ${res.status}`);
  const scripts = [
    ...res.text.matchAll(/<script[^>]+src="(https:\/\/[^"]+\.js)"/g),
  ].map((m) => m[1]);
  // The id lives in one of the last bundles: fetch those together instead
  // of one by one (each could take the full timeout).
  const lastFirst = scripts.reverse();
  for (let i = 0; i < lastFirst.length; i += 4) {
    const found = await Promise.all(
      lastFirst.slice(i, i + 4).map((src) =>
        get(src)
          .then((r) => findClientId(r.text))
          .catch(() => null),
      ),
    );
    const id = found.find((x): x is string => !!x);
    if (id) return id;
  }
  throw new Error('SoundCloud client_id not found');
}

const idFile = () => new File(Paths.document, 'soundcloud-client-id');
let cachedId: string | null = null;
let scraping: Promise<string> | null = null;

async function clientId(refresh: boolean): Promise<string> {
  if (!refresh) {
    if (cachedId) return cachedId;
    try {
      const file = idFile();
      const saved = file.exists ? file.textSync().trim() : '';
      if (saved.length === 32) {
        cachedId = saved;
        return saved;
      }
    } catch {}
  }
  scraping ??= scrapeClientId()
    .then((id) => {
      cachedId = id;
      try {
        const file = idFile();
        if (!file.exists) file.create();
        file.write(id);
      } catch {}
      return id;
    })
    .finally(() => {
      scraping = null;
    });
  return scraping;
}

/** GET with the client id, scraping a new one once if SoundCloud rotated it. */
// After a fresh id is refused too, every search would scrape again; go
// straight to the server for a while instead.
const REFUSED_PAUSE_MS = 10 * 60_000;
let refusedUntil = 0;

async function apiGet<T>(path: string, params: Record<string, string>) {
  if (Date.now() < refusedUntil) {
    throw new Error('SoundCloud direct paused after refusals');
  }
  let rescraped = false;
  let retried = false;
  for (;;) {
    const id = await clientId(rescraped);
    const query = new URLSearchParams({ ...params, client_id: id });
    const res = await get(`${API}${path}?${query}`);
    if (res.status === 401 || res.status === 403) {
      if (rescraped) {
        refusedUntil = Date.now() + REFUSED_PAUSE_MS;
        throw new Error('SoundCloud refused the client_id');
      }
      rescraped = true;
      continue;
    }
    // Rate limit or a hiccup: one retry before the server fallback.
    if ((res.status === 429 || res.status >= 500) && !retried) {
      retried = true;
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }
    if (!res.ok) throw new Error(`SoundCloud HTTP ${res.status}`);
    return JSON.parse(res.text) as T;
  }
}

type ApiTrack = {
  id: number;
  kind?: string;
  title?: string;
  duration?: number;
  full_duration?: number;
  permalink_url?: string;
  artwork_url?: string | null;
  playback_count?: number;
  likes_count?: number;
  policy?: string;
  user?: {
    id?: number;
    username?: string;
    permalink_url?: string;
    avatar_url?: string | null;
  };
};

/** `large` artwork is 100 px; the same URL serves 500 px under t500x500. */
const art = (url?: string | null) =>
  url ? url.replace(/-large(\.\w+)$/, '-t500x500$1') : undefined;

/** Same shape the EXØS API's /search/soundcloud returns. */
function toSearchTrack(t: ApiTrack): SoundCloudTrack | null {
  if (t.kind && t.kind !== 'track') return null;
  if (!t.title || !t.permalink_url || t.policy === 'BLOCK') return null;
  const cover = art(t.artwork_url ?? t.user?.avatar_url);
  return {
    id: String(t.id),
    title: t.title,
    uploader: t.user?.username ?? 'SoundCloud',
    uploader_id: String(t.user?.id ?? ''),
    uploader_url: t.user?.permalink_url ?? '',
    duration: Math.round((t.full_duration || t.duration || 0) / 1000),
    webpage_url: t.permalink_url,
    view_count: t.playback_count,
    like_count: t.likes_count,
    thumbnails: cover
      ? [{ id: 't500x500', url: cover, resolution: 't500x500' }]
      : [],
  };
}

export async function searchSoundCloudDirect(
  query: string,
  limit = 30,
): Promise<SoundCloudTrack[]> {
  const data = await apiGet<{ collection?: ApiTrack[] }>('/search/tracks', {
    q: query,
    limit: String(limit),
  });
  return (data.collection ?? [])
    .map(toSearchTrack)
    .filter((t): t is SoundCloudTrack => t !== null);
}

/* ---------- users (artist pages) ---------- */

type ApiUser = {
  id: number;
  username?: string;
  full_name?: string;
  avatar_url?: string | null;
  followers_count?: number;
  track_count?: number;
  permalink_url?: string;
};

export type SoundCloudUser = {
  id: string;
  name: string;
  pictureUrl?: string;
  followers: number;
  trackCount: number;
  url?: string;
};

/**
 * A user by numeric id, or by profile name as `@name` (the first part of a
 * track URL) for tracks that came without an id.
 */
async function apiUser(ref: string): Promise<ApiUser> {
  const user = ref.startsWith('@')
    ? await apiGet<ApiUser>('/resolve', {
        url: `https://soundcloud.com/${ref.slice(1)}`,
      })
    : await apiGet<ApiUser>(`/users/${encodeURIComponent(ref)}`, {});
  if (!user?.id) throw new Error('SoundCloud user not found');
  return user;
}

const userIds = new Map<string, number>();

async function userId(ref: string): Promise<number> {
  if (/^\d+$/.test(ref)) return Number(ref);
  const known = userIds.get(ref);
  if (known) return known;
  const { id } = await apiUser(ref);
  userIds.set(ref, id);
  return id;
}

export async function soundCloudUser(ref: string): Promise<SoundCloudUser> {
  const u = await apiUser(ref);
  userIds.set(ref, u.id);
  return {
    id: String(u.id),
    name: u.username || u.full_name || 'SoundCloud',
    pictureUrl: art(u.avatar_url),
    followers: u.followers_count ?? 0,
    trackCount: u.track_count ?? 0,
    url: u.permalink_url,
  };
}

/** The user's most played tracks. */
export async function soundCloudUserTopTracks(
  ref: string,
): Promise<SoundCloudTrack[]> {
  const id = await userId(ref);
  const page = await apiGet<{ collection?: ApiTrack[] }>(
    `/users/${id}/toptracks`,
    { limit: '50', linked_partitioning: '1' },
  );
  return (page.collection ?? [])
    .map(toSearchTrack)
    .filter((t): t is SoundCloudTrack => t !== null);
}

/** Pages of up to 100; this many is enough for any real profile. */
const MAX_UPLOAD_PAGES = 20;

/** `next_href` as a path and params for apiGet (minus the old client id). */
function splitHref(href: string): [string, Record<string, string>] | null {
  if (!href.startsWith(API)) return null;
  const [path, query = ''] = href.slice(API.length).split('?');
  const params: Record<string, string> = {};
  for (const pair of query.split('&')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    const key = decodeURIComponent(eq < 0 ? pair : pair.slice(0, eq));
    const value =
      eq < 0 ? '' : decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));
    if (key !== 'client_id') params[key] = value;
  }
  return [path, params];
}

/** Every upload of the user, newest first, following SoundCloud's pages. */
export async function soundCloudUserUploads(
  ref: string,
): Promise<SoundCloudTrack[]> {
  const id = await userId(ref);
  const out: SoundCloudTrack[] = [];
  let next: [string, Record<string, string>] | null = [
    `/users/${id}/tracks`,
    { limit: '100', linked_partitioning: '1' },
  ];
  for (let i = 0; next && i < MAX_UPLOAD_PAGES; i++) {
    const page: { collection?: ApiTrack[]; next_href?: string | null } =
      await apiGet(next[0], next[1]);
    for (const raw of page.collection ?? []) {
      const t = toSearchTrack(raw);
      if (t) out.push(t);
    }
    next = page.next_href ? splitHref(page.next_href) : null;
  }
  return out;
}
