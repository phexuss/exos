/**
 * Every screen's data by key, plus prefetches for hover and focus: pointing
 * at an album or artist starts loading it, so the click usually lands on a
 * screen that is already in memory.
 */
import { prefetch, useQuery } from './query';
import * as api from './services';
import type { Track } from './types';

const MIN = 60_000;

export const useChart = () => useQuery('chart', api.getChart, 10 * MIN);
export const useRecent = () => useQuery('recent', () => api.getCloudRecent().catch(() => [] as Track[]), MIN);
export const useSimilar = (seed: Track | null) =>
  useQuery(seed ? `similar:${seed.id}` : null, () => api.getSimilar(seed!), 30 * MIN);

/**
 * Similar tracks for the first of `seeds` that has any: Last.fm knows nothing
 * about many uploads and remixes, so one unknown track should not empty the shelf.
 */
export const useSimilarFirst = (seeds: Track[]) =>
  useQuery(
    seeds.length ? `similar-first:${seeds.map((s) => s.id).join(',')}` : null,
    async () => {
      for (const seed of seeds) {
        const list = await api.getSimilar(seed).catch(() => []);
        if (list.length) return { seed, list };
      }
      // Not null: a null result reads as still loading.
      return { seed: null, list: [] as Track[] };
    },
    30 * MIN,
  );

/** How much each source gives the home mix: Last.fm picks per seed, top tracks per artist. */
const MIX_PER_SEED = 8;
const MIX_PER_ARTIST = 4;
const MIX_SIZE = 20;

/**
 * The home mix: Last.fm tracks like the ones you played, dealt in turn with
 * the top tracks of your artists, so neither side takes the whole list.
 * Tracks in `skip` (already shown next to it) and repeats of a song are left out.
 */
export const useMix = (seeds: Track[], artistIds: string[], skip: string[]) =>
  useQuery(
    seeds.length || artistIds.length
      ? `mix:${seeds.map((s) => s.id).join(',')}|${artistIds.join(',')}|${skip.join(',')}`
      : null,
    async () => {
      const [similar, top] = await Promise.all([
        Promise.all(seeds.map((s) => api.getSimilar(s).catch(() => [] as Track[]))),
        Promise.all(artistIds.map((id) => api.getArtistTracks(id).catch(() => [] as Track[]))),
      ]);
      const lists = [...similar.map((l) => l.slice(0, MIX_PER_SEED)), ...top.map((l) => l.slice(0, MIX_PER_ARTIST))];
      const seen = new Set(skip);
      const songs = new Set<string>();
      const out: Track[] = [];
      for (let i = 0; out.length < MIX_SIZE && lists.some((l) => i < l.length); i++) {
        for (const l of lists) {
          const tr = l[i];
          if (!tr || seen.has(tr.id)) continue;
          const song = `${tr.artist.name}|${tr.title}`.toLowerCase();
          if (songs.has(song)) continue;
          seen.add(tr.id);
          songs.add(song);
          out.push(tr);
          if (out.length === MIX_SIZE) break;
        }
      }
      return out;
    },
    30 * MIN,
  );

export const useAlbum = (id: string) => useQuery(`album:${id}`, () => api.getAlbum(id), 30 * MIN);
export const useArtist = (id: string) => useQuery(id ? `artist:${id}` : null, () => api.getArtist(id), 30 * MIN);
export const useArtistTracks = (id: string) => useQuery(`artist-tracks:${id}`, () => api.getArtistTracks(id), 30 * MIN);
export const useArtistUploads = (id: string) =>
  useQuery(api.scRef(id) !== null ? `artist-uploads:${id}` : null, () => api.getArtistUploads(id), 30 * MIN);
export const useArtistAlbums = (id: string) => useQuery(`artist-albums:${id}`, () => api.getArtistAlbums(id), 30 * MIN);

export const useSearch = (q: string | null, source: 'deezer' | 'soundcloud') =>
  useQuery(q ? `search:${source}:${q}` : null, () => (source === 'deezer' ? api.searchDeezer(q!) : api.searchSoundCloud(q!)), 5 * MIN);

export function prefetchAlbum(id: string) {
  prefetch(`album:${id}`, () => api.getAlbum(id));
}

export function prefetchArtist(id: string) {
  prefetch(`artist:${id}`, () => api.getArtist(id));
  prefetch(`artist-tracks:${id}`, () => api.getArtistTracks(id));
  prefetch(`artist-albums:${id}`, () => api.getArtistAlbums(id));
}

export function prefetchSearch(q: string) {
  prefetch(`search:deezer:${q}`, () => api.searchDeezer(q));
}

/**
 * Handlers that call `load` once the pointer rests on an element (a pass
 * across the screen doesn't count) or keyboard focus reaches it.
 */
export function onIntent(load: () => void, delayMs = 70) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    onPointerEnter: () => {
      timer = setTimeout(load, delayMs);
    },
    onPointerLeave: () => clearTimeout(timer),
    onFocus: load,
  };
}
