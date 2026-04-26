import { Directory, File, Paths } from 'expo-file-system';

import { apiGet, apiPost } from '@/services/api/client';
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
  listeners.get(state.trackId)?.forEach((fn) => fn(state));
}

export function onDownloadProgress(trackId: string, fn: Listener): () => void {
  if (!listeners.has(trackId)) listeners.set(trackId, new Set());
  listeners.get(trackId)!.add(fn);
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

async function downloadFile(
  url: string,
  destination: File,
  onProgress: (progress: number) => void,
): Promise<string> {
  onProgress(0.2);
  const file = await File.downloadFileAsync(url, destination);
  onProgress(1);
  return file.uri;
}

export async function downloadTrack(track: Track): Promise<string> {
  if (activeDownloads.has(track.id)) {
    throw new Error('Already downloading');
  }
  activeDownloads.add(track.id);

  const state: DownloadState = {
    trackId: track.id,
    progress: 0,
    status: 'fetching_url',
  };
  emit(state);
  useDownloadStore.getState().setDownloadProgress(track.id, 0, 'fetching_url');

  try {
    // For SC tracks, isrc holds the webpage_url — pass it directly as query
    const isSC =
      track.source === 'soundcloud' && track.isrc?.startsWith('http');
    const { url } = await apiPost<{ url: string }>(API_ENDPOINTS.download, {
      query: isSC ? track.isrc! : `${track.artist.name} ${track.title}`,
      isrc: isSC ? undefined : track.isrc,
      format: 'mp3',
    });

    if (__DEV__) console.log('[Download] Got URL, downloading…');

    state.status = 'downloading';
    emit(state);
    useDownloadStore.getState().setDownloadProgress(track.id, 0, 'downloading');

    ensureDir();
    const destination = new File(TRACKS_DIR, `${track.id}.mp3`);
    if (destination.exists) {
      destination.delete();
    }

    const [lyrics, filePath] = await Promise.all([
      fetchLyrics(track.artist.name, track.title, track.durationSec),
      downloadFile(url, destination, (p: number) => {
        state.progress = p;
        emit(state);
        useDownloadStore
          .getState()
          .setDownloadProgress(track.id, p, 'downloading');
      }),
    ]);

    await insertDownloadedTrack(track, filePath, 'mp3', lyrics);
    useDownloadStore.getState().markDownloaded(track.id);

    state.status = 'done';
    state.progress = 1;
    emit(state);
    // markDownloaded already clears activeDownloads in the store

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
