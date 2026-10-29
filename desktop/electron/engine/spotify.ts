/**
 * Public Spotify playlists and albums by link, without a Spotify account.
 *
 * Spotify's Web API needs an app and, since late 2024, refuses most playlists
 * to new apps. The embed player page (what a site shows for an embedded
 * playlist) carries the playlist's name and track list as JSON, needs no
 * token, and is fetched from this computer like any web page. Only titles,
 * artists and lengths come from it; the window matches them to Deezer, and
 * playback goes the usual way (yt-dlp on YouTube).
 *
 * The embed lists the first 100 tracks. For a longer playlist, the ids of the
 * rest come from the playlist service the web player reads (spclient), with
 * the anonymous token the same page hands its player, and each one's title
 * from that track's own embed page. (The Web API answers that token with 429.)
 *
 * This is not an official API: if Spotify reshapes the page, the parser below
 * is the one place to fix.
 */
import { L } from './i18n';
import { UA } from './soundcloud';

export type SpotifyItem = { title: string; artist: string; durationSec: number };

/** open.spotify.com/{intl-xx/}playlist/ID, …/album/ID, or spotify:playlist:ID. */
export function parseLink(link: string): { kind: 'playlist' | 'album'; id: string } | null {
  const m =
    /open\.spotify\.com\/(?:intl-[\w-]+\/)?(?:embed\/)?(playlist|album)\/([A-Za-z0-9]+)/.exec(link) ??
    /^spotify:(playlist|album):([A-Za-z0-9]+)$/.exec(link.trim());
  return m ? { kind: m[1] as 'playlist' | 'album', id: m[2] } : null;
}

type Json = Record<string, any>;

/** Every JSON blob the page carries in <script type="application/json">, base64 or plain. */
function blobs(html: string): Json[] {
  const out: Json[] = [];
  const re = /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const text = m[1].trim();
    for (const decode of [(t: string) => t, (t: string) => Buffer.from(t, 'base64').toString('utf8')]) {
      try {
        out.push(JSON.parse(decode(text)));
        break;
      } catch {}
    }
  }
  return out;
}

/** The first object (depth first) that holds a track list. */
function findEntity(node: unknown, depth = 0): Json | null {
  if (!node || typeof node !== 'object' || depth > 12) return null;
  const o = node as Json;
  if (Array.isArray(o.trackList) || Array.isArray(o.tracks?.items)) return o;
  for (const v of Object.values(o)) {
    const hit = findEntity(v, depth + 1);
    if (hit) return hit;
  }
  return null;
}

function toItem(raw: Json): SpotifyItem | null {
  const t = raw.track ?? raw;
  const title = t.title ?? t.name;
  const artist =
    (Array.isArray(t.artists) ? t.artists.map((a: Json) => a.name).filter(Boolean).join(', ') : '') ||
    t.subtitle ||
    '';
  const ms = t.duration ?? t.duration_ms ?? 0;
  if (!title || typeof title !== 'string') return null;
  return {
    title,
    // The embed separates artists with ", " and sometimes a no-break space.
    artist: String(artist).replace(/ /g, ' ').trim(),
    durationSec: Math.round((typeof ms === 'number' ? ms : 0) / 1000),
  };
}

/** The anonymous web-player token the embed page carries for its own player. */
function findToken(node: unknown, depth = 0): string | null {
  if (!node || typeof node !== 'object' || depth > 12) return null;
  const o = node as Json;
  if (typeof o.accessToken === 'string' && o.accessToken.length > 20) return o.accessToken;
  for (const v of Object.values(o)) {
    const hit = findToken(v, depth + 1);
    if (hit) return hit;
  }
  return null;
}

/** `listed`: entries in the page's list, counted before dropping ones without a title (local files, episodes). */
export function parseEmbed(
  html: string,
): { name: string; items: SpotifyItem[]; listed: number; token: string | null } | null {
  const all = blobs(html);
  for (const blob of all) {
    const e = findEntity(blob);
    if (!e) continue;
    const list: Json[] = e.trackList ?? e.tracks.items;
    const items = list.map(toItem).filter((x): x is SpotifyItem => !!x);
    const token = all.map((b) => findToken(b)).find(Boolean) ?? null;
    return { name: e.name ?? e.title ?? 'Spotify', items, listed: list.length, token };
  }
  return null;
}

/** The embed lists at most this many tracks; the rest of a longer playlist is read separately. */
export const EMBED_LIMIT = 100;
const MAX_TRACKS = 10_000;

const get = (url: string, headers: Record<string, string> = {}) =>
  fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en', ...headers }, signal: AbortSignal.timeout(20_000) });

/**
 * Track ids of a playlist from position `from` on, from the playlist service
 * the web player itself reads (spclient), with the embed's anonymous token.
 * The Web API refuses that token (429, quota), this one does not. It sends
 * only track URIs; their titles come from `tracks()`.
 */
export async function restIds(id: string, token: string, from: number): Promise<string[]> {
  const ids: string[] = [];
  let pos = from;
  for (;;) {
    const res = await get(`https://spclient.wg.spotify.com/playlist/v2/playlist/${id}?from=${pos}&length=100`, {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { length?: number; contents?: { items?: { uri?: string }[] } };
    const page = body.contents?.items ?? [];
    for (const item of page) {
      // Episodes and local files have other URI kinds and nothing to look up.
      const m = /^spotify:track:([A-Za-z0-9]+)$/.exec(item.uri ?? '');
      if (m) ids.push(m[1]);
    }
    pos += page.length;
    if (!page.length || pos >= (body.length ?? 0) || pos >= MAX_TRACKS) return ids;
  }
}

/** One track's title, artists and length from its embed page. */
export function parseTrackEmbed(html: string): SpotifyItem | null {
  for (const blob of blobs(html)) {
    let hit: Json | null = null;
    const visit = (node: unknown, depth: number) => {
      if (hit || !node || typeof node !== 'object' || depth > 12) return;
      const o = node as Json;
      if ((o.type === 'track' || Array.isArray(o.artists)) && typeof (o.title ?? o.name) === 'string' && 'duration' in o) {
        hit = o;
        return;
      }
      for (const v of Object.values(o)) visit(v, depth + 1);
    };
    visit(blob, 0);
    if (hit) return toItem(hit);
  }
  return null;
}

/** Titles for track ids, a few pages at a time; a track that fails to load is left out (null). */
export async function tracks(ids: string[]): Promise<(SpotifyItem | null)[]> {
  const out: (SpotifyItem | null)[] = new Array(ids.length).fill(null);
  let next = 0;
  const worker = async () => {
    while (next < ids.length) {
      const i = next++;
      try {
        const res = await get(`https://open.spotify.com/embed/track/${ids[i]}`);
        if (res.ok) out[i] = parseTrackEmbed(await res.text());
      } catch {}
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return out;
}

/**
 * The first page of a playlist or album with its titles, plus the ids of the
 * tracks past it (`rest`) for the window to load through `tracks()` while it
 * shows progress. `truncated`: the list is longer and the rest could not be read.
 */
export async function playlist(
  link: string,
): Promise<{ name: string; items: SpotifyItem[]; rest: string[]; truncated: boolean }> {
  const ref = parseLink(link);
  if (!ref) throw new Error(L('не понял ссылку на Spotify', 'not a Spotify playlist or album link'));
  const res = await get(`https://open.spotify.com/embed/${ref.kind}/${ref.id}`).catch((e: Error) => {
    throw new Error(L(`Spotify не ответил: ${e.message}`, `Spotify did not answer: ${e.message}`));
  });
  if (res.status === 404)
    throw new Error(L('плейлист не найден или он закрытый', 'playlist not found, or it is private'));
  if (!res.ok) throw new Error(L(`Spotify ответил ${res.status}`, `Spotify answered ${res.status}`));
  const parsed = parseEmbed(await res.text());
  if (!parsed) throw new Error(L('Spotify поменял страницу, список треков не нашёлся', 'Spotify changed the page; no track list found'));
  if (!parsed.items.length) throw new Error(L('в плейлисте нет треков', 'the playlist has no tracks'));
  const { name, items, listed, token } = parsed;
  if (listed < EMBED_LIMIT) return { name, items, rest: [], truncated: false };
  // Albums past 100 tracks are rare and have no such service; they stop at the embed's list.
  if (!token || ref.kind !== 'playlist') return { name, items, rest: [], truncated: true };
  try {
    return { name, items, rest: await restIds(ref.id, token, listed), truncated: false };
  } catch {
    return { name, items, rest: [], truncated: true };
  }
}
