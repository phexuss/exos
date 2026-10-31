import { create } from 'zustand';
import { engine } from '@/lib/engine';
import type { Lyrics, Track, UserLyrics } from '@/lib/types';

type LyricsState = {
  /** Lyrics set by hand, by track id. They win over the library's and LRCLIB's. */
  byId: Record<string, UserLyrics>;
  loaded: boolean;
  /** The track whose lyrics are open in the editor. */
  editing: Track | null;
  load: () => Promise<void>;
  get: (id: string) => UserLyrics | undefined;
  save: (track: Track, lyrics: Lyrics) => void;
  remove: (id: string) => void;
  edit: (track: Track | null) => void;
};

export const useUserLyrics = create<LyricsState>((set, get) => {
  const persist = () => void engine.writeLyrics(Object.values(get().byId)).catch(() => {});
  return {
    byId: {},
    loaded: false,
    editing: null,
    load: async () => {
      if (get().loaded) return;
      const stored = (await engine.readLyrics().catch(() => null)) ?? [];
      set({ byId: Object.fromEntries(stored.map((l) => [l.id, l])), loaded: true });
    },
    get: (id) => get().byId[id],
    save: (track, lyrics) => {
      const entry: UserLyrics = {
        id: track.id,
        title: track.title,
        artist: track.artist.name,
        syncedLyrics: lyrics.syncedLyrics || null,
        plainLyrics: lyrics.plainLyrics || null,
        updatedAt: Date.now(),
      };
      set((s) => ({ byId: { ...s.byId, [track.id]: entry } }));
      persist();
    },
    remove: (id) => {
      if (!get().byId[id]) return;
      set((s) => {
        const { [id]: _gone, ...rest } = s.byId;
        return { byId: rest };
      });
      persist();
    },
    edit: (editing) => set({ editing }),
  };
});
