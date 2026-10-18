import { create } from 'zustand';

import { mapDeezerTrackToTrack } from '@/services/adapters/search.adapter';
import { ApiError } from '@/services/api/client';
import { getSpotifyImportPage } from '@/services/api/spotify';
import {
  addTrackToPlaylist,
  createPlaylist,
  getPlaylists,
  isTrackDownloaded,
} from '@/services/db/database';
import { downloadTrack } from '@/services/download/downloadService';
import { useDownloadStore } from '@/store/useDownloadStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

const BUSY_RETRIES = 3;
const BUSY_BACKOFF_MS = 5000;

export type SpotifyImportJob = {
  playlistId: string;
  playlistName: string;
  status: 'running' | 'done' | 'cancelled' | 'error';
  /** Spotify entries in the playlist. */
  total: number;
  /** Matched tracks handled so far (downloaded, already there, or failed). */
  processed: number;
  downloaded: number;
  skipped: number;
  failed: number;
  unmatched: number;
  error?: unknown;
};

type SpotifyImportState = {
  job: SpotifyImportJob | null;
  setJob: (job: SpotifyImportJob | null) => void;
  patchJob: (patch: Partial<SpotifyImportJob>) => void;
};

export const useSpotifyImportStore = create<SpotifyImportState>((set) => ({
  job: null,
  setJob: (job) => set({ job }),
  patchJob: (patch) =>
    set((s) => (s.job ? { job: { ...s.job, ...patch } } : s)),
}));

let cancelRequested = false;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isBusy(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.status === 503 || error.status === 429)
  );
}

async function findOrCreatePlaylist(name: string): Promise<string> {
  const existing = (await getPlaylists()).find((p) => p.name === name);
  return existing?.id ?? createPlaylist(name);
}

async function downloadWithRetry(track: Track): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      const download = await downloadTrack(track);
      usePlayerStore.getState().markTrackDownloaded(track.id, download);
      return;
    } catch (error) {
      if (!isBusy(error) || attempt >= BUSY_RETRIES || cancelRequested) {
        throw error;
      }
      await sleep(BUSY_BACKOFF_MS * (attempt + 1));
    }
  }
}

export function cancelSpotifyImport(): void {
  cancelRequested = true;
}

/**
 * Pulls a Spotify playlist page by page (the API matches each page to
 * Deezer), downloads every track that is not on the device yet, one at a
 * time like a manual download, and collects them in a local playlist with
 * the same name. Re-running it only fetches what is missing.
 */
export async function runSpotifyImport(
  playlistId: string,
  playlistName: string,
): Promise<void> {
  const { job, setJob, patchJob } = useSpotifyImportStore.getState();
  if (job?.status === 'running') return;

  cancelRequested = false;
  setJob({
    playlistId,
    playlistName,
    status: 'running',
    total: 0,
    processed: 0,
    downloaded: 0,
    skipped: 0,
    failed: 0,
    unmatched: 0,
  });

  const counts = {
    processed: 0,
    downloaded: 0,
    skipped: 0,
    failed: 0,
    unmatched: 0,
  };

  try {
    const localPlaylistId = await findOrCreatePlaylist(playlistName);
    let offset: number | null = 0;

    while (offset !== null && !cancelRequested) {
      const page = await getSpotifyImportPage(playlistId, offset);
      counts.unmatched += page.unmatched.length;
      patchJob({ total: page.total, unmatched: counts.unmatched });

      for (const deezerTrack of page.tracks) {
        if (cancelRequested) break;
        const track = mapDeezerTrackToTrack(deezerTrack);

        try {
          const alreadyHere =
            useDownloadStore.getState().downloadedIds.has(track.id) ||
            (await isTrackDownloaded(track.id));
          if (alreadyHere) {
            counts.skipped++;
          } else {
            await downloadWithRetry(track);
            counts.downloaded++;
          }
          await addTrackToPlaylist(localPlaylistId, track.id);
        } catch (error) {
          counts.failed++;
          if (__DEV__) console.warn('[SpotifyImport] Track failed:', error);
        }

        counts.processed++;
        patchJob({ ...counts });
      }

      offset = page.nextOffset;
    }

    patchJob({ ...counts, status: cancelRequested ? 'cancelled' : 'done' });
  } catch (error) {
    if (__DEV__) console.warn('[SpotifyImport] Import failed:', error);
    patchJob({ ...counts, status: 'error', error });
  }
}
