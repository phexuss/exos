import { create } from 'zustand';

import {
  deleteUserLyrics,
  getUserLyrics,
  type LyricsData,
  setUserLyrics,
} from '@/services/db/database';

type UserLyricsState = {
  /**
   * Lyrics set by hand, by track id: an entry, `null` when the track has
   * none, missing while it hasn't been looked up yet.
   */
  byId: Record<string, LyricsData | null>;
  load: (id: string) => void;
  save: (id: string, lyrics: LyricsData) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useUserLyricsStore = create<UserLyricsState>((set, get) => ({
  byId: {},
  load: (id) => {
    if (id in get().byId) return;
    getUserLyrics(id)
      .catch(() => null)
      .then((lyrics) => {
        // A save that landed while the lookup ran wins.
        if (id in get().byId) return;
        set((s) => ({ byId: { ...s.byId, [id]: lyrics } }));
      });
  },
  save: async (id, lyrics) => {
    await setUserLyrics(id, lyrics);
    set((s) => ({ byId: { ...s.byId, [id]: lyrics } }));
  },
  remove: async (id) => {
    await deleteUserLyrics(id);
    set((s) => ({ byId: { ...s.byId, [id]: null } }));
  },
}));
