import { create } from 'zustand';

import * as audio from '@/services/audio/audioService';
import { apiPost } from '@/services/api/client';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import { addRecentlyPlayed } from '@/services/db/database';
import type { Track } from '@/types/domain';

export type RepeatMode = 'off' | 'all' | 'one';

type PlayerState = {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  queue: Track[];
  shuffle: boolean;
  repeat: RepeatMode;
  showQueue: boolean;
  isPlayerOpen: boolean;

  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  togglePlayback: () => void;
  setProgress: (value: number) => void;
  skipNext: () => void;
  skipPrevious: () => void;
  setQueue: (tracks: Track[]) => void;
  markTrackDownloaded: (trackId: string, filePath: string) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setShowQueue: (show: boolean) => void;
  openPlayer: () => void;
  closePlayer: () => void;
};

/**
 * Smart playback — local file or resolve stream via backend.
 */
function smartPlay(track: Track, set: Function): boolean {
  if (__DEV__) console.log('[SmartPlay]', track.id, track.source, 'filePath:', !!track.filePath);
  addRecentlyPlayed(track).catch(() => {});

  if (track.filePath) {
    audio.playLocalFile(track.filePath);
    return true;
  }

  resolveAndPlayStream(track, set);
  return true;
}

async function resolveAndPlayStream(track: Track, set: Function) {
  try {
    const query = track.source === 'soundcloud'
      ? (track.isrc ?? `${track.artist.name} ${track.title}`)
      : `${track.artist.name} ${track.title}`;
    if (__DEV__) console.log('[Stream] Resolving:', query);
    const { url } = await apiPost<{ url: string }>(API_ENDPOINTS.download, {
      query,
      format: 'mp3',
    });
    audio.playUrl(url);
  } catch (e) {
    if (__DEV__) console.warn('[Stream] Failed to resolve URL:', e);
    set({ isPlaying: false });
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  queue: [],
  shuffle: false,
  repeat: 'off',
  showQueue: false,
  isPlayerOpen: false,

  play: (track) => {
    smartPlay(track, set);
    set({ currentTrack: track, isPlaying: true, progress: 0 });
  },

  pause: () => {
    set({ isPlaying: false });
    audio.pauseAudio();
  },

  resume: () => {
    set({ isPlaying: true });
    audio.resumeAudio();
  },

  togglePlayback: () => {
    const { isPlaying, currentTrack } = get();
    if (!currentTrack) return;
    if (isPlaying) {
      audio.pauseAudio();
    } else {
      audio.resumeAudio();
    }
    set({ isPlaying: !isPlaying });
  },

  setProgress: (value) => {
    set({ progress: value });
    audio.seekTo(value);
  },

  skipNext: () => {
    const { queue, currentTrack, shuffle } = get();
    if (!currentTrack || queue.length === 0) return;
    let next: Track | undefined;
    if (shuffle) {
      next = queue[Math.floor(Math.random() * queue.length)];
    } else {
      const idx = queue.findIndex((t) => t.id === currentTrack.id);
      next = queue[(idx + 1) % queue.length];
    }
    if (next) {
      if (smartPlay(next, set)) {
        set({ currentTrack: next, progress: 0, isPlaying: true });
      } else {
        set({ isPlaying: false });
      }
    }
  },

  skipPrevious: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prev = queue[(idx - 1 + queue.length) % queue.length];
    if (prev) {
      if (smartPlay(prev, set)) {
        set({ currentTrack: prev, progress: 0, isPlaying: true });
      } else {
        set({ isPlaying: false });
      }
    }
  },

  setQueue: (tracks) => set({ queue: tracks }),

  markTrackDownloaded: (trackId, filePath) =>
    set((s) => ({
      currentTrack:
        s.currentTrack?.id === trackId
          ? { ...s.currentTrack, filePath, isDownloaded: true }
          : s.currentTrack,
      queue: s.queue.map((t) =>
        t.id === trackId ? { ...t, filePath, isDownloaded: true } : t,
      ),
    })),

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

  cycleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off',
    })),

  setShowQueue: (show) => set({ showQueue: show }),

  openPlayer: () => set({ isPlayerOpen: true }),
  closePlayer: () => set({ isPlayerOpen: false, showQueue: false }),
}));

audio.bindStore(() => usePlayerStore);
