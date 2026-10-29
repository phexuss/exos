import { create } from 'zustand';
import { t } from '@/i18n';
import { engine } from '@/lib/engine';
import { IS_MOCK } from '@/lib/env';
import { exampleTracks } from '@/lib/mock';
import type { Playlist, Track } from '@/lib/types';
import { toast } from './toast';

type PlaylistsState = {
  playlists: Playlist[];
  loaded: boolean;
  /** Id of a playlist made a moment ago; its page opens with the name field focused. */
  justCreated: string | null;
  load: () => Promise<void>;
  get: (id: string) => Playlist | undefined;
  /** Creates a playlist (optionally with tracks) and returns its id. */
  create: (tracks?: Track[]) => string;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  add: (id: string, tracks: Track[]) => void;
  removeAt: (id: string, index: number) => void;
  move: (id: string, from: number, to: number) => void;
};

const newId = () => `pl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Only what a row and the player need; drops per-session fields a track may carry. */
const snapshot = (tr: Track): Track => {
  const { filePath: _f, format: _fmt, downloadedAt: _d, syncedLyrics: _s, plainLyrics: _p, ...rest } =
    tr as Track & Record<string, unknown>;
  return rest as Track;
};

export const usePlaylists = create<PlaylistsState>((set, get) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  // Writes are batched: dragging ten tracks in is one write, not ten.
  const save = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void engine.writePlaylists(get().playlists).catch(() => {}), 250);
  };
  const patch = (id: string, fn: (p: Playlist) => Playlist) => {
    set((s) => ({ playlists: s.playlists.map((p) => (p.id === id ? { ...fn(p), updatedAt: Date.now() } : p)) }));
    save();
  };

  return {
    playlists: [],
    loaded: false,
    justCreated: null,
    load: async () => {
      if (get().loaded) return;
      const stored = (await engine.readPlaylists().catch(() => null)) ?? [];
      const playlists =
        IS_MOCK && !stored.length
          ? [
              {
                id: 'pl_demo',
                name: 'Ночная смена',
                createdAt: 0,
                updatedAt: 0,
                tracks: exampleTracks.slice(0, 6),
              },
            ]
          : stored;
      set({ playlists, loaded: true });
    },
    get: (id) => get().playlists.find((p) => p.id === id),
    create: (tracks = []) => {
      const n = get().playlists.length + 1;
      const now = Date.now();
      const playlist: Playlist = {
        id: newId(),
        name: t('playlist.defaultName', { n }),
        createdAt: now,
        updatedAt: now,
        tracks: tracks.map(snapshot),
      };
      set((s) => ({ playlists: [playlist, ...s.playlists], justCreated: playlist.id }));
      save();
      return playlist.id;
    },
    rename: (id, name) => {
      const clean = name.trim();
      if (clean) patch(id, (p) => ({ ...p, name: clean.slice(0, 100) }));
    },
    remove: (id) => {
      set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));
      save();
    },
    add: (id, tracks) => {
      const p = get().get(id);
      if (!p) return;
      const have = new Set(p.tracks.map((tr) => tr.id));
      const fresh = tracks.filter((tr) => !have.has(tr.id));
      if (!fresh.length) {
        toast(t('playlist.already', { name: p.name }));
        return;
      }
      patch(id, (pl) => ({ ...pl, tracks: [...pl.tracks, ...fresh.map(snapshot)] }));
      toast(
        fresh.length === 1
          ? t('playlist.added', { title: fresh[0].title, name: p.name })
          : t('playlist.addedMany', { n: fresh.length, name: p.name }),
      );
    },
    removeAt: (id, index) => patch(id, (p) => ({ ...p, tracks: p.tracks.filter((_, i) => i !== index) })),
    move: (id, from, to) =>
      patch(id, (p) => {
        const tracks = [...p.tracks];
        const [moved] = tracks.splice(from, 1);
        tracks.splice(Math.max(0, Math.min(tracks.length, to)), 0, moved);
        return { ...p, tracks };
      }),
  };
});
