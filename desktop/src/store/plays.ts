/**
 * Who you listen to, for "Your artists" on the search page. Each track heard
 * for a while gives its artist one play; older plays fade with a half-life so
 * the list follows what you listen to now. Kept in localStorage, never sent.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { artistPageId } from '@/lib/services';
import type { Track } from '@/lib/types';
import { usePlayer } from './player';

/** A play counts after this much listening, or half the track if it is shorter. */
const COUNT_AFTER_SEC = 30;
/** A play loses half its weight in this time. */
const HALF_LIFE_MS = 14 * 24 * 3600_000;
const MAX_ARTISTS = 200;
const MAX_RECENT = 20;

export type ArtistStat = {
  /** Artist page to open (Deezer id or `sc:…`); null opens a search by name. */
  page: string | null;
  name: string;
  source: Track['source'];
  /** A cover of one of their tracks: the picture when the artist has none. */
  coverUrl?: string;
  score: number;
  last: number;
};

type PlaysState = {
  artists: Record<string, ArtistStat>;
  /** Keys hidden from "Your artists". */
  hidden: string[];
  /** Tracks heard long enough to count, newest first: seeds for "Because you listened to". */
  recent: Track[];
  count: (track: Track, at?: number) => void;
  hide: (key: string) => void;
};

export const artistKey = (track: Track) => artistPageId(track) ?? `name:${track.artist.name.trim().toLowerCase()}`;

/** A score as it stands at `now`. */
export const decayed = (score: number, last: number, now: number) => score * 0.5 ** (Math.max(0, now - last) / HALF_LIFE_MS);

export function statFor(track: Track, score: number, last: number): ArtistStat {
  return {
    page: artistPageId(track),
    name: track.artist.name,
    source: track.source,
    coverUrl: track.coverUrl,
    score,
    last,
  };
}

export const usePlays = create<PlaysState>()(
  persist(
    (set) => ({
      artists: {},
      hidden: [],
      recent: [],
      count: (track, at = Date.now()) => {
        if (!track.artist.name.trim()) return;
        const key = artistKey(track);
        const { id, title, artist, album, albumId, durationSec, coverUrl, isrc, source } = track;
        const snap: Track = { id, title, artist: { ...artist }, album, albumId, durationSec, coverUrl, isrc, source };
        set((s) => ({ recent: [snap, ...s.recent.filter((x) => x.id !== id)].slice(0, MAX_RECENT) }));
        set((s) => {
          const prev = s.artists[key];
          const score = (prev ? decayed(prev.score, prev.last, at) : 0) + 1;
          let artists = { ...s.artists, [key]: { ...statFor(track, score, at), coverUrl: track.coverUrl ?? prev?.coverUrl } };
          const keys = Object.keys(artists);
          if (keys.length > MAX_ARTISTS) {
            const drop = keys.sort((a, b) => decayed(artists[a].score, artists[a].last, at) - decayed(artists[b].score, artists[b].last, at))[0];
            const { [drop]: _gone, ...rest } = artists;
            artists = rest;
          }
          return { artists };
        });
      },
      hide: (key) => set((s) => ({ hidden: s.hidden.includes(key) ? s.hidden : [...s.hidden, key] })),
    }),
    {
      name: 'exos.plays',
      version: 1,
      partialize: (s) => ({ artists: s.artists, hidden: s.hidden, recent: s.recent }),
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

/** Starts counting plays; called once at startup. */
export function trackPlays(): () => void {
  let counted: string | null = null;
  let currentId: string | undefined;
  return usePlayer.subscribe((s) => {
    if (s.current?.id !== currentId) {
      currentId = s.current?.id;
      counted = null;
    }
    if (!s.current || counted === s.current.id || s.status !== 'playing') return;
    const need = s.duration > 0 ? Math.min(COUNT_AFTER_SEC, s.duration / 2) : COUNT_AFTER_SEC;
    if (s.time < need) return;
    counted = s.current.id;
    usePlays.getState().count(s.current);
  });
}
