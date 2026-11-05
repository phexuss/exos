import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StateCreator } from 'zustand';
import { API_BASE_URL, apiPost } from '@/services/api/client';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import * as audio from '@/services/audio/audioService';
import { addRecentlyPlayed, getDownloadedTrack } from '@/services/db/database';
import {
  invalidateLocalStream,
  isLocalEngineAvailable,
  prefetchLocalStream,
  resolveLocalStream,
} from '@/services/engine/localEngine';
import { syncRecentlyPlayedTrack } from '@/services/sync/librarySyncService';
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
  advanceAfterEnd: () => void;
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

type DownloadTicketResponse = {
  token: string;
  expiresAt: number;
};

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

function getStreamQuery(track: Track): string {
  if (track.source === 'soundcloud' && track.isrc) {
    return track.isrc;
  }
  return `${track.artist.name} ${track.title}`;
}

function getStreamContentType(track: Track): string {
  return track.source === 'soundcloud' ? 'audio/mpeg' : 'audio/mp4';
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
  void syncRecentlyPlayedTrack(track);

  if (track.filePath) {
    audio.playLocalFile(track.filePath);
    return;
  }

  playDownloadedOrResolveStream(track, set, get, requestId);
}

const RESTART_THRESHOLD_SEC = 3;
/** The track already restarted once after a playback error. */
let retriedTrackId: string | null = null;

/**
 * Next track for the queue. `auto` is the end of a track: with repeat off
 * playback stops after the last one. A tap on "next" at the end wraps.
 * Shuffle never picks the current track. A track played from outside the
 * queue continues with the queue's first track.
 */
function pickNext(
  state: Pick<PlayerState, 'queue' | 'currentTrack' | 'shuffle' | 'repeat'>,
  auto: boolean,
): Track | undefined {
  const { queue, currentTrack, shuffle, repeat } = state;
  if (!currentTrack || queue.length === 0) return undefined;
  const idx = queue.findIndex((t) => t.id === currentTrack.id);
  const others = queue.filter((t) => t.id !== currentTrack.id);
  if (shuffle) {
    if (others.length === 0)
      return auto && repeat === 'off' ? undefined : currentTrack;
    return others[Math.floor(Math.random() * others.length)];
  }
  if (idx < 0) return queue[0];
  if (idx + 1 < queue.length) return queue[idx + 1];
  if (auto && repeat === 'off') return undefined;
  return queue[0];
}

function startTrack(track: Track, set: PlayerSet, get: PlayerGet): void {
  const requestId = ++playbackRequestId;
  // The previous track kept playing for the seconds yt-dlp takes to resolve
  // the new one (and for good if that failed), under the new track's UI.
  if (get().currentTrack?.id !== track.id) {
    audio.silenceCurrent();
    retriedTrackId = null;
  }
  set({ currentTrack: track, isPlaying: true, progress: 0 });
  audio.prepareTrackPlayback(track.id);
  smartPlay(track, set, get, requestId);
  prefetchNextTrack(get);
}

/**
 * Resolves the next queued track's stream URL ahead of time (on the phone,
 * or on the server without the native engine), so skipping to it starts
 * without the yt-dlp delay. Best-effort.
 */
function prefetchNextTrack(get: PlayerGet): void {
  const { queue, currentTrack, shuffle, repeat } = get();
  if (!currentTrack || shuffle || repeat === 'one' || queue.length < 2) return;

  const next = pickNext(get(), true);
  if (!next || next.id === currentTrack.id || next.filePath) return;

  if (isLocalEngineAvailable) {
    prefetchLocalStream(next);
    return;
  }
  apiPost(`${API_ENDPOINTS.download}/prefetch`, {
    query: getStreamQuery(next),
    format: 'm4a',
    mode: 'stream',
  }).catch(() => {});
}

function resumeCurrentTrack(set: PlayerSet): void {
  set({ isPlaying: true });
  audio.resumeAudio();
}

function resumeOrRestartTrack(
  track: Track,
  set: PlayerSet,
  get: PlayerGet,
): void {
  if (audio.hasLoadedTrack(track.id)) {
    resumeCurrentTrack(set);
  } else {
    startTrack(track, set, get);
  }
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
      if (!get().isPlaying) {
        audio.clearPendingTrackPlayback(track.id);
        return;
      }
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
  if (isLocalEngineAvailable) {
    try {
      const stream = await resolveLocalStream(track);
      if (!isCurrentPlaybackRequest(requestId, track.id, get)) return;
      if (!get().isPlaying) {
        audio.clearPendingTrackPlayback(track.id);
        return;
      }
      audio.playUrl(stream.url, {
        contentType: stream.contentType,
        headers: stream.headers,
        hls: stream.hls,
      });
      return;
    } catch (e) {
      console.warn(
        `[Stream] On-device yt-dlp failed for trackId=${track.id}, using server:`,
        e,
      );
      if (!isCurrentPlaybackRequest(requestId, track.id, get)) return;
    }
  }
  await resolveServerStream(track, set, get, requestId);
}

async function resolveServerStream(
  track: Track,
  set: PlayerSet,
  get: PlayerGet,
  requestId: number,
): Promise<void> {
  const query = getStreamQuery(track);
  // Log unconditionally so we can trace failures from production builds via
  // adb logcat. The matching server-side log is in DownloadService.resolveDirectUrl.
  console.warn(
    `[Stream] Resolving (source=${track.source} trackId=${track.id}):`,
    query,
  );
  try {
    const { token } = await apiPost<DownloadTicketResponse>(
      `${API_ENDPOINTS.download}/stream-ticket`,
      { query, format: 'm4a', mode: 'stream' },
    );
    const params = new URLSearchParams({ token });
    const streamUrl = `${API_BASE_URL}${API_ENDPOINTS.download}/stream-ticket?${params.toString()}`;
    console.warn(`[Stream] Ticket ready for trackId=${track.id}`);
    if (!isCurrentPlaybackRequest(requestId, track.id, get)) return;
    if (!get().isPlaying) {
      audio.clearPendingTrackPlayback(track.id);
      return;
    }
    set({ isPlaying: true });
    audio.playUrl(streamUrl, { contentType: getStreamContentType(track) });
  } catch (e) {
    console.warn(
      `[Stream] Failed to resolve URL for trackId=${track.id} query="${query}":`,
      e,
    );
    if (!isCurrentPlaybackRequest(requestId, track.id, get)) return;
    audio.clearPendingTrackPlayback(track.id);
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

      if (!isPlaying) {
        resumeOrRestartTrack(track, set, get);
      }
      return;
    }

    startTrack(track, set, get);
  },

  pause: () => {
    set({ isPlaying: false });
    audio.pauseAudio();
  },

  resume: () => {
    const { currentTrack } = get();
    if (!currentTrack) return;

    resumeOrRestartTrack(currentTrack, set, get);
  },

  togglePlayback: () => {
    const { isPlaying, currentTrack } = get();
    if (!currentTrack) return;
    if (isPlaying) {
      audio.pauseAudio();
      set({ isPlaying: false });
      return;
    }

    resumeOrRestartTrack(currentTrack, set, get);
  },

  setProgress: (value) => {
    // Without a duration the seek is dropped; moving the bar anyway made it
    // jump back on the next poll.
    if (!audio.getDuration()) return;
    set({ progress: value });
    audio.seekTo(value);
  },

  skipNext: () => {
    const next = pickNext(get(), false);
    if (next) startTrack(next, set, get);
  },

  skipPrevious: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack) return;
    // Like every player: a few seconds in, "previous" restarts the track.
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (audio.getPositionSeconds() > RESTART_THRESHOLD_SEC || idx <= 0) {
      if (audio.hasLoadedTrack(currentTrack.id)) {
        set({ progress: 0 });
        audio.seekTo(0);
      } else {
        startTrack(currentTrack, set, get);
      }
      return;
    }
    startTrack(queue[idx - 1], set, get);
  },

  /** End of a track: follows repeat, and stops at the end of the queue. */
  advanceAfterEnd: () => {
    const next = pickNext(get(), true);
    if (next) {
      startTrack(next, set, get);
      return;
    }
    // Rewind so a later tap on play starts the track again.
    set({ isPlaying: false, progress: 0 });
    audio.seekTo(0);
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

/**
 * A stream that fails mid-way (expired googlevideo link, 403, network
 * switch) was resumed on the same dead URL forever. Drop the cached link
 * and start the track once more; a second failure stops for real.
 */
audio.setPlaybackErrorHandler(() => {
  const state = usePlayerStore.getState();
  const track = state.currentTrack;
  if (!track) return;
  if (!track.filePath) invalidateLocalStream(track);
  if (retriedTrackId === track.id) return;
  retriedTrackId = track.id;
  startTrack(track, usePlayerStore.setState, usePlayerStore.getState);
});

/**
 * The queue and current track lived only in memory: after Android killed
 * the app (playback continues in the service), the notification's next and
 * previous did nothing and the app reopened without a mini player.
 */
const SESSION_KEY = 'player:session';
const SESSION_QUEUE_MAX = 300;

function slim(track: Track): Track {
  // Lyrics can be tens of KB per track; they are fetched again on play.
  const { syncedLyrics: _s, plainLyrics: _p, ...rest } = track;
  return rest;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let restored = false;

usePlayerStore.subscribe((state, prev) => {
  if (!restored) return;
  if (state.queue === prev.queue && state.currentTrack === prev.currentTrack) {
    return;
  }
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const { queue, currentTrack } = usePlayerStore.getState();
    const payload = currentTrack
      ? JSON.stringify({
          currentTrack: slim(currentTrack),
          queue: queue.slice(0, SESSION_QUEUE_MAX).map(slim),
        })
      : null;
    (payload
      ? AsyncStorage.setItem(SESSION_KEY, payload)
      : AsyncStorage.removeItem(SESSION_KEY)
    ).catch(() => {});
  }, 1000);
});

AsyncStorage.getItem(SESSION_KEY)
  .then((raw) => {
    if (!raw || usePlayerStore.getState().currentTrack) return;
    const saved = JSON.parse(raw) as { currentTrack?: Track; queue?: Track[] };
    if (!saved.currentTrack?.id) return;
    // Paused: a tap on play starts it again (or the still-running service
    // reports Playing and the UI follows).
    usePlayerStore.setState({
      currentTrack: saved.currentTrack,
      queue: Array.isArray(saved.queue) ? saved.queue : [],
      isPlaying: false,
      progress: 0,
    });
  })
  .catch(() => {})
  .finally(() => {
    restored = true;
  });
