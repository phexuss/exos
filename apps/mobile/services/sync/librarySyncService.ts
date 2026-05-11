import {
  cloudTrackToTrack,
  getCloudRecentlyPlayed,
  trackToCloudTrack,
  upsertCloudDownload,
  upsertCloudDownloadsBulk,
  upsertCloudRecentlyPlayed,
  upsertCloudRecentlyPlayedBulk,
} from '@/services/api/library';
import { getAccessToken } from '@/services/auth/tokenStorage';
import {
  getDownloadedTracks,
  getRecentlyPlayed,
  insertRecentlyPlayed,
} from '@/services/db/database';
import type { Track } from '@/types/domain';

let initialSyncInFlight: Promise<void> | null = null;

async function hasAuthToken(): Promise<boolean> {
  return !!(await getAccessToken());
}

function logSyncError(scope: string, error: unknown): void {
  if (__DEV__) console.warn(`[LibrarySync] ${scope}:`, error);
}

export async function syncDownloadedTrack(track: Track): Promise<void> {
  try {
    if (!(await hasAuthToken())) return;
    const payload = trackToCloudTrack(track, { addedAt: Date.now() });
    if (!payload) return;
    await upsertCloudDownload(payload);
  } catch (error) {
    logSyncError('download skipped', error);
  }
}

export async function syncRecentlyPlayedTrack(track: Track): Promise<void> {
  try {
    if (!(await hasAuthToken())) return;
    const payload = trackToCloudTrack(track, { playedAt: Date.now() });
    if (!payload) return;
    await upsertCloudRecentlyPlayed(payload);
  } catch (error) {
    logSyncError('recent skipped', error);
  }
}

async function pushLocalLibrary(): Promise<void> {
  const [downloads, recent] = await Promise.all([
    getDownloadedTracks().catch(() => [] as Track[]),
    getRecentlyPlayed(100).catch(() => [] as Track[]),
  ]);

  const cloudDownloads = downloads
    .map((track) => trackToCloudTrack(track))
    .filter((track) => track !== null);
  const cloudRecent = recent
    .map((track) => trackToCloudTrack(track))
    .filter((track) => track !== null);

  await Promise.all([
    cloudDownloads.length
      ? upsertCloudDownloadsBulk(cloudDownloads)
      : Promise.resolve(),
    cloudRecent.length
      ? upsertCloudRecentlyPlayedBulk(cloudRecent)
      : Promise.resolve(),
  ]);
}

export async function syncLocalLibraryNow(): Promise<void> {
  try {
    if (!(await hasAuthToken())) return;
    await pushLocalLibrary();
  } catch (error) {
    logSyncError('local push skipped', error);
  }
}

async function pullRecentlyPlayed(): Promise<void> {
  const cloudRecent = await getCloudRecentlyPlayed(100);

  await Promise.all(
    cloudRecent.map((track) => {
      const localTrack = cloudTrackToTrack(track);
      const playedAt = track.playedAt ? Date.parse(track.playedAt) : Date.now();
      return insertRecentlyPlayed(localTrack, playedAt);
    }),
  );
}

async function syncInitialLibrary(): Promise<void> {
  if (!(await hasAuthToken())) return;
  await pullRecentlyPlayed();
  await pushLocalLibrary();
}

export function runInitialLibrarySync(): void {
  if (initialSyncInFlight) return;

  initialSyncInFlight = syncInitialLibrary()
    .catch((error) => logSyncError('initial sync skipped', error))
    .finally(() => {
      initialSyncInFlight = null;
    });
}
