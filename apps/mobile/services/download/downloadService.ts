import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';

import { API_BASE_URL, apiGet } from '@/services/api/client';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import {
  deleteDownloadedTrack as deleteFromDb,
  getDownloadedTrack,
  insertDownloadedTrack,
  type LyricsData,
} from '@/services/db/database';
import { useDownloadStore } from '@/store/useDownloadStore';
import type { Track } from '@/types/domain';

const TRACKS_DIR = new Directory(Paths.document, 'tracks');
const DEFAULT_DOWNLOAD_FORMAT = 'm4a';
type DownloadFormat = typeof DEFAULT_DOWNLOAD_FORMAT | 'mp3';
const APPROX_TRACK_BYTES = 5 * 1024 * 1024;

function ensureDir() {
  if (!TRACKS_DIR.exists) {
    TRACKS_DIR.create();
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
    listeners.get(trackId)?.delete(fn);
  };
}

export function isDownloading(trackId: string): boolean {
  return activeDownloads.has(trackId);
}

function primaryArtist(artist: string): string {
  return artist.split(/\s*[&,]\s*|\s+feat\.?\s+|\s+ft\.?\s+/i)[0].trim();
}

function getDownloadFormat(track: Track): DownloadFormat {
  return track.source === 'soundcloud' ? 'mp3' : DEFAULT_DOWNLOAD_FORMAT;
}

async function fetchLyrics(
  artist: string,
  title: string,
  duration: number,
): Promise<LyricsData | null> {
  try {
    const data = await apiGet<{ syncedLyrics?: string; plainLyrics?: string }>(
      API_ENDPOINTS.lyrics,
      {
        artist: primaryArtist(artist),
        track: title,
        duration: String(duration),
      },
    );
    return {
      syncedLyrics: data.syncedLyrics ?? null,
      plainLyrics: data.plainLyrics ?? null,
    };
  } catch {
    return null;
  }
}

function buildStreamUrl(track: Track, format: DownloadFormat): string {
  const soundCloudUrl =
    track.source === 'soundcloud' && track.isrc?.startsWith('http')
      ? track.isrc
      : null;
  const query = soundCloudUrl
    ? soundCloudUrl
    : `${track.artist.name} ${track.title}`;
  const params = new URLSearchParams();
  params.set('query', query);
  if (!soundCloudUrl && track.isrc) params.set('isrc', track.isrc);
  params.set('format', format);
  return `${API_BASE_URL}${API_ENDPOINTS.download}/stream?${params.toString()}`;
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
  onProgress(1);
  return result.uri;
}

export async function downloadTrack(track: Track): Promise<string> {
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

  try {
    ensureDir();
    const downloadFormat = getDownloadFormat(track);
    const destination = new File(TRACKS_DIR, `${track.id}.${downloadFormat}`);
    if (destination.exists) {
      destination.delete();
    }

    const streamUrl = buildStreamUrl(track, downloadFormat);
    if (__DEV__) console.log('[Download] Streaming from:', streamUrl);

    const [lyrics, filePath] = await Promise.all([
      fetchLyrics(track.artist.name, track.title, track.durationSec),
      downloadStream(streamUrl, destination.uri, (p: number) => {
        state.progress = p;
        emit(state);
        useDownloadStore
          .getState()
          .setDownloadProgress(track.id, p, 'downloading');
      }),
    ]);

    await insertDownloadedTrack(track, filePath, downloadFormat, lyrics);
    useDownloadStore.getState().markDownloaded(track.id);

    state.status = 'done';
    state.progress = 1;
    emit(state);

    if (__DEV__)
      console.log('[Download] Saved:', filePath, lyrics ? '+ lyrics' : '');
    return filePath;
  } catch (e) {
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
  if (track?.file_path) {
    try {
      const file = new File(track.file_path);
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
