import { create } from "zustand";

import type { Track } from "@/types/domain";

export type RepeatMode = "off" | "all" | "one";

type PlayerState = {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  queue: Track[];
  shuffle: boolean;
  repeat: RepeatMode;
  showQueue: boolean;

  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  togglePlayback: () => void;
  setProgress: (value: number) => void;
  skipNext: () => void;
  skipPrevious: () => void;
  setQueue: (tracks: Track[]) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setShowQueue: (show: boolean) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  queue: [],
  shuffle: false,
  repeat: "off",
  showQueue: false,

  play: (track) => set({ currentTrack: track, isPlaying: true, progress: 0 }),

  pause: () => set({ isPlaying: false }),

  resume: () => set({ isPlaying: true }),

  togglePlayback: () => {
    const { isPlaying, currentTrack } = get();
    if (!currentTrack) return;
    set({ isPlaying: !isPlaying });
  },

  setProgress: (value) => set({ progress: value }),

  skipNext: () => {
    const { queue, currentTrack, shuffle } = get();
    if (!currentTrack || queue.length === 0) return;
    if (shuffle) {
      const random = queue[Math.floor(Math.random() * queue.length)];
      if (random) set({ currentTrack: random, progress: 0, isPlaying: true });
      return;
    }
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const next = queue[(idx + 1) % queue.length];
    if (next) set({ currentTrack: next, progress: 0, isPlaying: true });
  },

  skipPrevious: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prev = queue[(idx - 1 + queue.length) % queue.length];
    if (prev) set({ currentTrack: prev, progress: 0, isPlaying: true });
  },

  setQueue: (tracks) => set({ queue: tracks }),

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

  cycleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
    })),

  setShowQueue: (show) => set({ showQueue: show }),
}));
