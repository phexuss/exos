import { create, type StateCreator } from 'zustand';
import { apiPost } from '@/services/api/client';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import * as audio from '@/services/audio/audioService';
import { addRecentlyPlayed, getDownloadedTrack } from '@/services/db/database';
import type { Track } from '@/types/domain';

export type RepeatMode = 'off' | 'all' | 'one';

export type TrackDownloadUpdate = {
  filePath: string;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
};

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
  markTrackDownloaded: (trackId: string, download: TrackDownloadUpdate) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setShowQueue: (show: boolean) => void;
  openPlayer: () => void;
  closePlayer: () => void;
};

type PlayerSet = Parameters<StateCreator<PlayerState>>[0];
type PlayerGet = Parameters<StateCreator<PlayerState>>[1];

let playbackRequestId = 0;

function isCurrentPlaybackRequest(
  requestId: number,
  trackId: string,
  get: PlayerGet,
): boolean {
  return requestId === playbackRequestId && get().currentTrack?.id === trackId;
}

function withDownloadInfo(track: Track, download: TrackDownloadUpdate): Track {
  return {
    ...track,
    filePath: download.filePath,
    isDownloaded: true,
    syncedLyrics: download.syncedLyrics ?? track.syncedLyrics,
    plainLyrics: download.plainLyrics ?? track.plainLyrics,
  };
}

function updateDownloadedTrackState(
  trackId: string,
  download: TrackDownloadUpdate,
  set: PlayerSet,
): void {
  set((s) => ({
    currentTrack:
      s.currentTrack?.id === trackId
        ? withDownloadInfo(s.currentTrack, download)
        : s.currentTrack,
    queue: s.queue.map((t) =>
      t.id === trackId ? withDownloadInfo(t, download) : t,
    ),
  }));
}

function getDownloadUpdateFromTrack(track: Track): TrackDownloadUpdate | null {
  if (!track.filePath) return null;
  return {
    filePath: track.filePath,
    syncedLyrics: track.syncedLyrics,
    plainLyrics: track.plainLyrics,
  };
}

async function hydrateCurrentTrackDownload(
  trackId: string,
  set: PlayerSet,
  get: PlayerGet,
): Promise<void> {
  try {
    const downloadedTrack = await getDownloadedTrack(trackId);
    if (!downloadedTrack?.filePath || get().currentTrack?.id !== trackId) {
      return;
    }
    updateDownloadedTrackState(trackId, downloadedTrack, set);
  } catch (e) {
    if (__DEV__) console.warn('[SmartPlay] Local hydrate failed:', e);
  }
}

function smartPlay(
  track: Track,
  set: PlayerSet,
  get: PlayerGet,
  requestId: number,
): void {
  if (__DEV__)
    console.log(
      '[SmartPlay]',
      track.id,
      track.source,
      'filePath:',
      !!track.filePath,
    );
  addRecentlyPlayed(track).catch(() => {});

  if (track.filePath) {
    audio.playLocalFile(track.filePath);
    return;
  }

  playDownloadedOrResolveStream(track, set, get, requestId);
}

function startTrack(track: Track, set: PlayerSet, get: PlayerGet): void {
  const requestId = ++playbackRequestId;
  set({ currentTrack: track, isPlaying: true, progress: 0 });
  smartPlay(track, set, get, requestId);
}

function resumeCurrentTrack(set: PlayerSet): void {
  set({ isPlaying: true });
  audio.resumeAudio();
}

async function playDownloadedOrResolveStream(
  track: Track,
  set: PlayerSet,
  get: PlayerGet,
  requestId: number,
): Promise<void> {
  try {
    const downloadedTrack = await getDownloadedTrack(track.id);
    if (downloadedTrack?.filePath) {
      if (!isCurrentPlaybackRequest(requestId, track.id, get)) return;
      updateDownloadedTrackState(track.id, downloadedTrack, set);
      if (!get().isPlaying) return;
      audio.playLocalFile(downloadedTrack.filePath);
      return;
    }
  } catch (e) {
    if (__DEV__) console.warn('[SmartPlay] Local lookup failed:', e);
  }

  resolveAndPlayStream(track, set, get, requestId);
}

async function resolveAndPlayStream(
  track: Track,
  set: PlayerSet,
  get: PlayerGet,
  requestId: number,
): Promise<void> {
  try {
    const query =
      track.source === 'soundcloud'
        ? (track.isrc ?? `${track.artist.name} ${track.title}`)
        : `${track.artist.name} ${track.title}`;
    if (__DEV__) console.log('[Stream] Resolving:', query);
    const { url } = await apiPost<{ url: string }>(API_ENDPOINTS.download, {
      query,
      format: 'm4a',
    });
    if (!isCurrentPlaybackRequest(requestId, track.id, get)) return;
    if (!get().isPlaying) return;
    set({ isPlaying: true });
    audio.playUrl(url);
  } catch (e) {
    if (__DEV__) console.warn('[Stream] Failed to resolve URL:', e);
    if (!isCurrentPlaybackRequest(requestId, track.id, get)) return;
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
    const { currentTrack, isPlaying } = get();
    if (currentTrack?.id === track.id) {
      const download = getDownloadUpdateFromTrack(track);
      if (download) {
        updateDownloadedTrackState(track.id, download, set);
      } else if (!currentTrack.filePath) {
        void hydrateCurrentTrackDownload(track.id, set, get);
      }

      if (!isPlaying) resumeCurrentTrack(set);
      return;
    }

    startTrack(track, set, get);
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
      startTrack(next, set, get);
    }
  },

  skipPrevious: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prev = queue[(idx - 1 + queue.length) % queue.length];
    if (prev) {
      startTrack(prev, set, get);
    }
  },

  setQueue: (tracks) => set({ queue: tracks }),

  markTrackDownloaded: (trackId, download) =>
    updateDownloadedTrackState(trackId, download, set),

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
