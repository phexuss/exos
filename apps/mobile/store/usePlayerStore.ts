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
  isPreview: boolean;
  progress: number;
  queue: Track[];
  shuffle: boolean;
  repeat: RepeatMode;
  showQueue: boolean;

  playPreview: (track: Track) => void;
  playLocal: (track: Track) => void;
  playStream: (track: Track) => void;
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
};

function startPlayback(track: Track, isPreview: boolean) {
  if (track.filePath) {
    audio.playLocalFile(track.filePath);
  } else if (isPreview && track.previewUrl) {
    audio.playUrl(track.previewUrl);
  }
  addRecentlyPlayed(track).catch(() => {});
}

async function resolveAndPlayStream(track: Track, set: Function) {
  try {
    // For SC tracks, isrc holds the webpage_url
    const query = track.isrc ?? `${track.artist.name} ${track.title}`;
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
  isPreview: false,
  progress: 0,
  queue: [],
  shuffle: false,
  repeat: 'off',
  showQueue: false,

  playPreview: (track) => {
    if (!track.previewUrl) return;
    set({ currentTrack: track, isPlaying: true, isPreview: true, progress: 0 });
    startPlayback(track, true);
  },

  playLocal: (track) => {
    if (!track.filePath) return;
    set({ currentTrack: track, isPlaying: true, isPreview: false, progress: 0 });
    startPlayback(track, false);
  },

  playStream: (track) => {
    set({ currentTrack: track, isPlaying: true, isPreview: false, progress: 0 });
    addRecentlyPlayed(track).catch(() => {});
    resolveAndPlayStream(track, set);
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
    const { queue, currentTrack, shuffle, isPreview } = get();
    if (!currentTrack || queue.length === 0) return;
    let next: Track | undefined;
    if (shuffle) {
      next = queue[Math.floor(Math.random() * queue.length)];
    } else {
      const idx = queue.findIndex((t) => t.id === currentTrack.id);
      next = queue[(idx + 1) % queue.length];
    }
    if (next) {
      set({ currentTrack: next, progress: 0, isPlaying: true });
      if (next.source === 'soundcloud' && !next.filePath) {
        addRecentlyPlayed(next).catch(() => {});
        resolveAndPlayStream(next, set);
      } else {
        startPlayback(next, isPreview);
      }
    }
  },

  skipPrevious: () => {
    const { queue, currentTrack, isPreview } = get();
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prev = queue[(idx - 1 + queue.length) % queue.length];
    if (prev) {
      set({ currentTrack: prev, progress: 0, isPlaying: true });
      if (prev.source === 'soundcloud' && !prev.filePath) {
        addRecentlyPlayed(prev).catch(() => {});
        resolveAndPlayStream(prev, set);
      } else {
        startPlayback(prev, isPreview);
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
}));

audio.bindStore(() => usePlayerStore);
