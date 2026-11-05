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

async function get(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: controller.signal,
    });
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
  const html = await res.text();
  const scripts = [
    ...html.matchAll(/<script[^>]+src="(https:\/\/[^"]+\.js)"/g),
  ].map((m) => m[1]);
  // The id lives in one of the last bundles.
  for (const src of scripts.reverse()) {
    try {
      const id = findClientId(await (await get(src)).text());
      if (id) return id;
    } catch {}
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
async function apiGet<T>(path: string, params: Record<string, string>) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const id = await clientId(attempt === 1);
    const query = new URLSearchParams({ ...params, client_id: id });
    const res = await get(`${API}${path}?${query}`);
    if ((res.status === 401 || res.status === 403) && attempt === 0) continue;
    if (!res.ok) throw new Error(`SoundCloud HTTP ${res.status}`);
    return (await res.json()) as T;
  }
  throw new Error('SoundCloud refused the client_id');
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
