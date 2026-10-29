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

export function parseEmbed(html: string): { name: string; items: SpotifyItem[] } | null {
  for (const blob of blobs(html)) {
    const e = findEntity(blob);
    if (!e) continue;
    const list: Json[] = e.trackList ?? e.tracks.items;
    const items = list.map(toItem).filter((x): x is SpotifyItem => !!x);
    return { name: e.name ?? e.title ?? 'Spotify', items };
  }
  return null;
}

export async function playlist(link: string): Promise<{ name: string; items: SpotifyItem[] }> {
  const ref = parseLink(link);
  if (!ref) throw new Error(L('не понял ссылку на Spotify', 'not a Spotify playlist or album link'));
  const res = await fetch(`https://open.spotify.com/embed/${ref.kind}/${ref.id}`, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en' },
    signal: AbortSignal.timeout(20_000),
  }).catch((e: Error) => {
    throw new Error(L(`Spotify не ответил: ${e.message}`, `Spotify did not answer: ${e.message}`));
  });
  if (res.status === 404)
    throw new Error(L('плейлист не найден или он закрытый', 'playlist not found, or it is private'));
  if (!res.ok) throw new Error(L(`Spotify ответил ${res.status}`, `Spotify answered ${res.status}`));
  const parsed = parseEmbed(await res.text());
  if (!parsed) throw new Error(L('Spotify поменял страницу, список треков не нашёлся', 'Spotify changed the page; no track list found'));
  if (!parsed.items.length) throw new Error(L('в плейлисте нет треков', 'the playlist has no tracks'));
  return parsed;
}
