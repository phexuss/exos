/**
 * Playlist import by link. SoundCloud sets come back from the engine as
 * playable tracks. Spotify gives only titles, artists and lengths, so each one
 * is looked up on Deezer (for the cover, album and ISRC); a track Deezer does
 * not know stays as artist + title and plays through a YouTube search.
 */
import { call } from './bridge';
import { IS_MOCK } from './env';
import * as mock from './mock';
import { searchDeezer } from './services';
import type { Track } from './types';

export type ImportSource = 'soundcloud' | 'spotify';

export type ImportProgress = { stage: 'reading' } | { stage: 'matching'; done: number; total: number };

export type ImportResult = { name: string; source: ImportSource; tracks: Track[]; unmatched: number };

type SpotifyItem = { title: string; artist: string; durationSec: number };

export function importSource(text: string): ImportSource | null {
  const s = text.trim();
  if (/^https?:\/\/(www\.|m\.)?soundcloud\.com\/[^/\s]+\/sets\/[^/\s]+/i.test(s)) return 'soundcloud';
  if (/^https?:\/\/on\.soundcloud\.com\/\w+/i.test(s)) return 'soundcloud';
  if (/^(https?:\/\/open\.spotify\.com\/(intl-[\w-]+\/)?(playlist|album)\/\w+|spotify:(playlist|album):\w+)/i.test(s))
    return 'spotify';
  return null;
}

/* ---------- matching Spotify titles to Deezer ---------- */

/** Lowercase, no accents, no "(feat. …)", "[Remastered]" or " - 2011 Remaster" tails. */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s[-–—]\s.*$/, '')
    .replace(/[([].*?[)\]]/g, ' ')
    .replace(/\b(feat|ft)\.?\s.*$/, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function score(item: SpotifyItem, c: Track): number {
  const a = norm(item.title);
  const b = norm(c.title);
  const title = a === b ? 2 : a && b && (a.includes(b) || b.includes(a)) ? 1 : 0;
  if (!title) return 0;
  const lead = norm(item.artist.split(',')[0] ?? '');
  const who = norm(c.artist.name);
  const artist = lead && who && (lead.includes(who) || who.includes(lead)) ? 2 : 0;
  const gap = item.durationSec && c.durationSec ? Math.abs(item.durationSec - c.durationSec) : 99;
  const length = gap <= 3 ? 2 : gap <= 10 ? 1 : gap > 30 ? -2 : 0;
  // A right title alone is not enough: covers and remixes share titles.
  return artist || length > 0 ? title + artist + length : 0;
}

export function bestMatch(item: SpotifyItem, candidates: Track[]): Track | null {
  let best: Track | null = null;
  let top = 0;
  for (const c of candidates.slice(0, 8)) {
    const s = score(item, c);
    if (s > top) [best, top] = [c, s];
  }
  return best;
}

async function matchOne(item: SpotifyItem): Promise<Track | null> {
  const lead = item.artist.split(',')[0]?.trim() ?? '';
  const clean = (s: string) => s.replace(/"/g, '');
  try {
    const strict = await searchDeezer(`artist:"${clean(lead)}" track:"${clean(item.title)}"`);
    const hit = bestMatch(item, strict);
    if (hit) return hit;
    return bestMatch(item, await searchDeezer(`${lead} ${item.title}`));
  } catch {
    return null;
  }
}

/** Plays through a YouTube search for "artist title", like any track without a known source. */
const unmatchedTrack = (item: SpotifyItem): Track => ({
  id: `sp_${norm(item.artist)}_${norm(item.title)}`.replace(/\s+/g, '-'),
  title: item.title,
  artist: { id: '', name: item.artist },
  durationSec: item.durationSec,
  source: 'deezer',
});

async function matchAll(items: SpotifyItem[], onProgress: (p: ImportProgress) => void): Promise<Track[]> {
  const out: (Track | null)[] = new Array(items.length).fill(null);
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = (await matchOne(items[i])) ?? unmatchedTrack(items[i]);
      onProgress({ stage: 'matching', done: ++done, total: items.length });
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  return out as Track[];
}

export async function importPlaylist(url: string, onProgress: (p: ImportProgress) => void): Promise<ImportResult> {
  const source = importSource(url);
  if (!source) throw new Error('unsupported link');
  onProgress({ stage: 'reading' });
  if (IS_MOCK) {
    const tracks = (await mock.search('mock', 'deezer')).slice(0, 6);
    for (let i = 1; i <= tracks.length; i += 1) {
      await new Promise((r) => setTimeout(r, 120));
      onProgress({ stage: 'matching', done: i, total: tracks.length });
    }
    return { name: source === 'spotify' ? 'Spotify mix' : 'SoundCloud set', source, tracks, unmatched: 1 };
  }
  if (source === 'soundcloud') {
    const set = await call<{ name: string; tracks: Track[] }>('import_soundcloud', { url: url.trim() });
    return { name: set.name, source, tracks: set.tracks, unmatched: 0 };
  }
  const list = await call<{ name: string; items: SpotifyItem[] }>('import_spotify', { url: url.trim() });
  const tracks = await matchAll(list.items, onProgress);
  return { name: list.name, source, tracks, unmatched: tracks.filter((tr) => tr.id.startsWith('sp_')).length };
}
