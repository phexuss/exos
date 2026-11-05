import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';

import { onYtdlpProgress } from '@/modules/exos-ytdlp';
import { API_BASE_URL, ApiError, apiPost } from '@/services/api/client';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import {
  deleteDownloadedTrack as deleteFromDb,
  getDownloadedTrack,
  insertDownloadedTrack,
} from '@/services/db/database';
import {
  downloadLocal,
  isLocalEngineAvailable,
} from '@/services/engine/localEngine';
import { fetchLyrics } from '@/services/lyrics/lyricsService';
import { syncDownloadedTrack } from '@/services/sync/librarySyncService';
import { useDownloadStore } from '@/store/useDownloadStore';
import type { Track } from '@/types/domain';

const TRACKS_DIR = new Directory(Paths.document, 'tracks');
const DEFAULT_DOWNLOAD_FORMAT = 'm4a';
type DownloadFormat = typeof DEFAULT_DOWNLOAD_FORMAT | 'mp3';
const APPROX_TRACK_BYTES = 5 * 1024 * 1024;
const MIN_AUDIO_BYTES = 1024;

export type DownloadResult = {
  filePath: string;
  syncedLyrics?: string;
  plainLyrics?: string;
};

type DownloadPayload = {
  query: string;
  isrc?: string;
  format: DownloadFormat;
  mode: 'download';
};

type DownloadTicketResponse = {
  token: string;
  expiresAt: number;
};

function ensureDir() {
  if (!TRACKS_DIR.exists) {
    TRACKS_DIR.create({ idempotent: true });
  }
}

export type DownloadState = {
  trackId: string;
  progress: number;
  status: 'idle' | 'fetching_url' | 'downloading' | 'done' | 'error';
  error?: string;
};

type Listener = (state: DownloadState) => void;
const listeners = new Map<string, Set<Listener>>();
const activeDownloads = new Set<string>();

function emit(state: DownloadState) {
  for (const fn of listeners.get(state.trackId) ?? []) {
    fn(state);
  }
}

export function onDownloadProgress(trackId: string, fn: Listener): () => void {
  let trackListeners = listeners.get(trackId);
  if (!trackListeners) {
    trackListeners = new Set();
    listeners.set(trackId, trackListeners);
  }
  trackListeners.add(fn);
  return () => {
    const set = listeners.get(trackId);
    if (!set) return;
    set.delete(fn);

    if (set.size === 0) {
      listeners.delete(trackId);
    }
  };
}

export function isDownloading(trackId: string): boolean {
  return activeDownloads.has(trackId);
}

export async function clearDownloadedTrackFiles(): Promise<void> {
  if (activeDownloads.size > 0) {
    throw new Error('Downloads are still running');
  }

  if (TRACKS_DIR.exists) {
    TRACKS_DIR.delete();
  }
  TRACKS_DIR.create({ idempotent: true });
}

function getDownloadFormat(track: Track): DownloadFormat {
  return track.source === 'soundcloud' ? 'mp3' : DEFAULT_DOWNLOAD_FORMAT;
}

function buildDownloadPayload(
  track: Track,
  format: DownloadFormat,
): DownloadPayload {
  const soundCloudUrl =
    track.source === 'soundcloud' && track.isrc?.startsWith('http')
      ? track.isrc
      : null;
  const query = soundCloudUrl
    ? soundCloudUrl
    : `${track.artist.name} ${track.title}`;

  return {
    query,
    isrc: !soundCloudUrl ? track.isrc : undefined,
    format,
    mode: 'download',
  };
}

async function createStreamTicketUrl(
  payload: DownloadPayload,
): Promise<string> {
  const ticket = await apiPost<DownloadTicketResponse>(
    `${API_ENDPOINTS.download}/stream-ticket`,
    payload,
  );
  const params = new URLSearchParams({ token: ticket.token });
  return `${API_BASE_URL}${API_ENDPOINTS.download}/stream-ticket?${params.toString()}`;
}

async function downloadStream(
  streamUrl: string,
  destinationUri: string,
  onProgress: (progress: number) => void,
): Promise<string> {
  const resumable = createDownloadResumable(
    streamUrl,
    destinationUri,
    {},
    (progress) => {
      const total = progress.totalBytesExpectedToWrite;
      const written = progress.totalBytesWritten;
      let ratio: number;
      if (total > 0) {
        ratio = written / total;
      } else {
        ratio = Math.min(0.95, written / APPROX_TRACK_BYTES);
      }
      onProgress(Math.max(0, Math.min(1, ratio)));
    },
  );

  const result = await resumable.downloadAsync();
  if (!result?.uri) {
    throw new Error('Download failed: empty result');
  }
  if (result.status < 200 || result.status >= 300) {
    throw new ApiError(result.status, `Download failed: HTTP ${result.status}`);
  }

  const downloadedFile = new File(result.uri);
  if (!downloadedFile.exists || downloadedFile.size < MIN_AUDIO_BYTES) {
    throw new Error('Download failed: empty audio file');
  }

  onProgress(1);
  return result.uri;
}

/** Last meaningful line of a yt-dlp failure, for an error toast. */
function shortError(message: string): string {
  const lines = message
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const line =
    lines.reverse().find((l) => l.startsWith('ERROR:')) ?? lines[0] ?? message;
  return line.replace(/^ERROR:\s*/, '').slice(0, 200);
}

/** `file:///a/b` -> `/a/b`, which is what yt-dlp's `-o` wants. */
function toFsPath(uri: string): string {
  return decodeURIComponent(uri.replace(/^file:\/\//, ''));
}

/**
 * yt-dlp on the phone first (from the user's own IP), the EXØS server only
 * when that fails or the native engine is missing (Expo Go).
 */
async function downloadAudio(
  track: Track,
  serverFormat: DownloadFormat,
  destination: File,
  onProgress: (progress: number) => void,
): Promise<{ filePath: string; format: string }> {
  let localError: unknown = null;
  if (isLocalEngineAvailable) {
    const jobId = `download-${track.id}-${Date.now()}`;
    const sub = onYtdlpProgress((event) => {
      if (event.id === jobId && event.progress >= 0) {
        onProgress(Math.min(0.99, event.progress / 100));
      }
    });
    try {
      const base = toFsPath(new File(TRACKS_DIR, track.id).uri);
      const { path, ext } = await downloadLocal(track, jobId, base);
      onProgress(1);
      return { filePath: `file://${path}`, format: ext };
    } catch (e) {
      localError = e;
      console.warn(
        `[Download] On-device yt-dlp failed for ${track.id}, using server:`,
        e,
      );
    } finally {
      sub?.remove();
    }
  }

  try {
    const streamUrl = await createStreamTicketUrl(
      buildDownloadPayload(track, serverFormat),
    );
    if (__DEV__) console.log('[Download] Streaming from:', streamUrl);
    const filePath = await downloadStream(
      streamUrl,
      destination.uri,
      onProgress,
    );
    return { filePath, format: serverFormat };
  } catch (serverError) {
    // The on-device error says what actually went wrong; the server is
    // only a fallback, so its failure would hide it.
    if (localError instanceof Error) {
      throw new Error(`yt-dlp: ${shortError(localError.message)}`);
    }
    throw serverError;
  }
}

export async function downloadTrack(track: Track): Promise<DownloadResult> {
  if (activeDownloads.has(track.id)) {
    throw new Error('Already downloading');
  }
  activeDownloads.add(track.id);

  const state: DownloadState = {
    trackId: track.id,
    progress: 0,
    status: 'downloading',
  };
  emit(state);
  useDownloadStore.getState().setDownloadProgress(track.id, 0, 'downloading');

  let destination: File | null = null;

  try {
    ensureDir();
    const downloadFormat = getDownloadFormat(track);
    destination = new File(TRACKS_DIR, `${track.id}.${downloadFormat}`);
    if (destination.exists) {
      destination.delete();
    }

    state.status = 'fetching_url';
    emit(state);
    useDownloadStore
      .getState()
      .setDownloadProgress(track.id, 0, 'fetching_url');

    const onProgress = (p: number) => {
      if (state.status !== 'downloading') {
        state.status = 'downloading';
      }
      state.progress = p;
      emit(state);
      useDownloadStore
        .getState()
        .setDownloadProgress(track.id, p, 'downloading');
    };

    const [lyrics, saved] = await Promise.all([
      fetchLyrics(track.artist.name, track.title, track.durationSec),
      downloadAudio(track, downloadFormat, destination, onProgress),
    ]);
    const { filePath, format: savedFormat } = saved;

    await insertDownloadedTrack(track, filePath, savedFormat, lyrics);
    void syncDownloadedTrack(track);
    useDownloadStore.getState().markDownloaded(track.id);

    state.status = 'done';
    state.progress = 1;
    emit(state);

    if (__DEV__)
      console.log('[Download] Saved:', filePath, lyrics ? '+ lyrics' : '');
    return {
      filePath,
      syncedLyrics: lyrics?.syncedLyrics ?? undefined,
      plainLyrics: lyrics?.plainLyrics ?? undefined,
    };
  } catch (e) {
    if (destination?.exists) {
      destination.delete();
    }
    state.status = 'error';
    state.error = e instanceof Error ? e.message : 'Unknown error';
    if (__DEV__) console.warn('[Download] Error:', state.error);
    emit(state);
    useDownloadStore.getState().clearDownloadProgress(track.id);
    throw e;
  } finally {
    activeDownloads.delete(track.id);
  }
}

export async function deleteTrack(trackId: string): Promise<void> {
  const track = await getDownloadedTrack(trackId);
  if (track?.filePath) {
    try {
      const file = new File(track.filePath);
      if (file.exists) {
        file.delete();
      }
    } catch (e) {
      if (__DEV__) console.warn('[Delete] File removal failed:', e);
    }
  }
  await deleteFromDb(trackId);
  useDownloadStore.getState().markRemoved(trackId);
  if (__DEV__) console.log('[Delete] Track removed:', trackId);
}
