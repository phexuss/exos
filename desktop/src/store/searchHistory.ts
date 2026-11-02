import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Track } from '@/lib/types';

/** How many of each the search start page keeps. */
const MAX_QUERIES = 12;
const MAX_TRACKS = 20;

type SearchHistoryState = {
  /** Newest first. */
  queries: string[];
  /** Tracks played from search results, newest first. */
  tracks: Track[];
  addQuery: (q: string) => void;
  removeQuery: (q: string) => void;
  addTrack: (track: Track) => void;
  removeTrack: (index: number) => void;
  clearQueries: () => void;
  clearTracks: () => void;
};

const same = (a: string, b: string) => a.toLocaleLowerCase() === b.toLocaleLowerCase();

/** Only what a row and the player need. */
const snapshot = (tr: Track): Track => {
  const { id, title, artist, album, albumId, durationSec, coverUrl, isrc, source } = tr;
  return { id, title, artist: { ...artist }, album, albumId, durationSec, coverUrl, isrc, source };
};

export const useSearchHistory = create<SearchHistoryState>()(
  persist(
    (set) => ({
      queries: [],
      tracks: [],
      addQuery: (raw) => {
        const q = raw.trim().slice(0, 200);
        if (!q) return;
        set((s) => ({ queries: [q, ...s.queries.filter((x) => !same(x, q))].slice(0, MAX_QUERIES) }));
      },
      removeQuery: (q) => set((s) => ({ queries: s.queries.filter((x) => x !== q) })),
      addTrack: (track) =>
        set((s) => ({ tracks: [snapshot(track), ...s.tracks.filter((x) => x.id !== track.id)].slice(0, MAX_TRACKS) })),
      removeTrack: (index) => set((s) => ({ tracks: s.tracks.filter((_, i) => i !== index) })),
      clearQueries: () => set({ queries: [] }),
      clearTracks: () => set({ tracks: [] }),
    }),
    {
      name: 'exos.searchHistory',
      version: 1,
      partialize: (s) => ({ queries: s.queries, tracks: s.tracks }),
      storage: createJSONStorage(() => {
        try {
          return localStorage;
        } catch {
          return sessionStorage;
        }
      }),
    },
  ),
);
