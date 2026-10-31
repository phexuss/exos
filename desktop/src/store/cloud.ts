import { create } from 'zustand';
import * as api from '@/lib/services';
import type { LocalTrack, Track } from '@/lib/types';

/**
 * The account's downloads as the server keeps them: a list shared with the
 * phone app, not the audio. A track in it that is not on this computer can be
 * downloaded again from its source.
 */
export type CloudItem = { track: Track; addedAt: number };

type CloudState = {
  items: CloudItem[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  /** Files this computer's downloads in the cloud, then reads the whole list back. */
  sync: (local: LocalTrack[]) => Promise<void>;
  /** A download finished here; it was filed on its own (services.syncDownload). */
  added: (track: Track) => void;
  reset: () => void;
};

let pushed = false;

export const useCloud = create<CloudState>((set, get) => ({
  items: [],
  status: 'idle',
  error: null,
  sync: async (local) => {
    if (get().status === 'loading') return;
    set({ status: 'loading', error: null });
    // Once per session is enough: later downloads are filed as they finish.
    if (!pushed) {
      try {
        await api.pushDownloads(local);
        pushed = true;
      } catch (e) {
        console.warn('[cloud] local library not saved', e);
      }
    }
    try {
      set({ items: await api.getCloudDownloads(), status: 'ready' });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  },
  added: (track) =>
    set((s) => ({
      items: [{ track, addedAt: Date.now() }, ...s.items.filter((i) => !sameTrack(i.track, track))],
    })),
  reset: () => {
    pushed = false;
    set({ items: [], status: 'idle', error: null });
  },
}));

/** The phone files SoundCloud tracks by link, so a link match counts as the same track. */
export function sameTrack(a: Track, b: Track): boolean {
  if (a.id === b.id) return true;
  return a.source === 'soundcloud' && b.source === 'soundcloud' && !!a.isrc && a.isrc === b.isrc;
}

/** Cloud tracks that are not on this computer. */
export function missingHere(items: CloudItem[], local: Track[]): Track[] {
  const ids = new Set(local.map((t) => t.id));
  const links = new Set(local.filter((t) => t.source === 'soundcloud' && t.isrc).map((t) => t.isrc));
  return items
    .map((i) => i.track)
    .filter((t) => !ids.has(t.id) && !(t.source === 'soundcloud' && t.isrc && links.has(t.isrc)));
}
