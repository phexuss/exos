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

export const useAlbum = (id: string) => useQuery(`album:${id}`, () => api.getAlbum(id), 30 * MIN);
export const useArtist = (id: string) => useQuery(`artist:${id}`, () => api.getArtist(id), 30 * MIN);
export const useArtistTracks = (id: string) => useQuery(`artist-tracks:${id}`, () => api.getArtistTracks(id), 30 * MIN);
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
