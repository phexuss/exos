import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type CloudLibraryTrack,
  type CloudPlaylist,
  type CloudTrackKey,
  cloudKeyForTrack,
  cloudTrackToTrack,
  deleteCloudPlaylist,
  getCloudPlaylists,
  getCloudRecentlyPlayed,
  removeCloudDownloads,
  trackToCloudTrack,
  upsertCloudDownload,
  upsertCloudDownloadsBulk,
  upsertCloudPlaylist,
  upsertCloudRecentlyPlayed,
  upsertCloudRecentlyPlayedBulk,
} from '@/services/api/library';
import { getAccessToken } from '@/services/auth/tokenStorage';
import {
  getDownloadedTracks,
  getPlaylists,
  getPlaylistTrackIds,
  getPlaylistTracks,
  getRecentlyPlayed,
  insertRecentlyPlayed,
  restorePlaylist,
  setPlaylistListener,
} from '@/services/db/database';
import type { Track } from '@/types/domain';

let initialSyncInFlight: Promise<void> | null = null;
let signedInUserId: string | null = null;

/**
 * The local library (SQLite + files) has no owner column, so it belongs to
 * whoever first synced it on this phone. Bulk-pushing it under another
 * account would copy one person's downloads and history into someone
 * else's cloud backup; that account only gets what it plays or downloads
 * itself (per-track sync below).
 */
const LIBRARY_OWNER_KEY = 'library:ownerId';

async function ownsLocalLibrary(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const owner = await AsyncStorage.getItem(LIBRARY_OWNER_KEY);
  if (owner === userId) return true;
  if (owner) return false;
  await AsyncStorage.setItem(LIBRARY_OWNER_KEY, userId);
  return true;
}

async function hasAuthToken(): Promise<boolean> {
  return !!(await getAccessToken());
}

function logSyncError(scope: string, error: unknown): void {
  console.warn(`[LibrarySync] ${scope}:`, error);
}

/** The API takes at most 500 tracks per bulk call. */
function chunks<T>(items: T[], size = 500): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
}

/**
 * Changes that failed to reach the server (offline, API down) wait here
 * and go out with the next sync, instead of being dropped.
 */
const PENDING_KEY = 'library:pending';
type Pending = {
  removed: CloudTrackKey[];
  playlists: string[];
  deletedPlaylists: string[];
};

async function readPending(): Promise<Pending> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Pending>) : {};
    return {
      removed: parsed.removed ?? [],
      playlists: parsed.playlists ?? [],
      deletedPlaylists: parsed.deletedPlaylists ?? [],
    };
  } catch {
    return { removed: [], playlists: [], deletedPlaylists: [] };
  }
}

async function addPending(change: Partial<Pending>): Promise<void> {
  const pending = await readPending();
  pending.removed.push(...(change.removed ?? []));
  for (const id of change.playlists ?? []) {
    if (!pending.playlists.includes(id)) pending.playlists.push(id);
  }
  for (const id of change.deletedPlaylists ?? []) {
    if (!pending.deletedPlaylists.includes(id))
      pending.deletedPlaylists.push(id);
    pending.playlists = pending.playlists.filter((p) => p !== id);
  }
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending)).catch(
    () => {},
  );
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

  // A library over 500 tracks used to fail the whole push (API limit).
  for (const part of chunks(cloudDownloads)) {
    await upsertCloudDownloadsBulk(part);
  }
  for (const part of chunks(cloudRecent)) {
    await upsertCloudRecentlyPlayedBulk(part);
  }
}

/**
 * Pushes the whole local library now. Throws, so the Restore screen can say
 * the backup didn't go through instead of pretending it did.
 */
export async function syncLocalLibraryNow(): Promise<void> {
  if (!(await hasAuthToken())) return;
  if (!(await ownsLocalLibrary(signedInUserId))) return;
  await flushPending().catch((e) => logSyncError('pending kept', e));
  await pushLocalLibrary();
  await pushAllPlaylists().catch((e) => logSyncError('playlists skipped', e));
}

/** Deleted downloads leave the backup too, so Restore stops offering them. */
export async function syncRemovedTracks(tracks: Track[]): Promise<void> {
  const keys = tracks
    .map(cloudKeyForTrack)
    .filter((k): k is CloudTrackKey => k !== null);
  if (keys.length === 0) return;
  try {
    if (!(await hasAuthToken())) return;
    for (const part of chunks(keys)) await removeCloudDownloads(part);
  } catch (error) {
    logSyncError('remove queued', error);
    await addPending({ removed: keys });
  }
}

// --- Playlists -------------------------------------------------------------

const SNAPSHOT_PREFIX = 'playlist:cloud:';

/**
 * Last cloud copy of each playlist's tracks. Tracks whose download was
 * deleted have no local row any more; their metadata comes from here so
 * the backup keeps them.
 */
async function readSnapshot(id: string): Promise<CloudLibraryTrack[]> {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_PREFIX + id);
    return raw ? (JSON.parse(raw) as CloudLibraryTrack[]) : [];
  } catch {
    return [];
  }
}

function writeSnapshot(id: string, tracks: CloudLibraryTrack[]): void {
  AsyncStorage.setItem(SNAPSHOT_PREFIX + id, JSON.stringify(tracks)).catch(
    () => {},
  );
}

async function buildCloudPlaylist(id: string): Promise<CloudPlaylist | null> {
  const playlist = (await getPlaylists()).find((p) => p.id === id);
  if (!playlist) return null;
  const [ids, local, snapshot] = await Promise.all([
    getPlaylistTrackIds(id),
    getPlaylistTracks(id),
    readSnapshot(id),
  ]);
  const localById = new Map(local.map((t) => [t.id, t]));
  const snapById = new Map(
    snapshot.map((t) => [t.trackId ?? t.deezerId ?? t.scUrl ?? '', t]),
  );
  const tracks: CloudLibraryTrack[] = [];
  for (const trackId of ids) {
    const track = localById.get(trackId);
    const cloud = track ? trackToCloudTrack(track) : snapById.get(trackId);
    if (cloud) tracks.push(cloud);
  }
  return {
    clientId: id,
    name: playlist.name,
    coverUrl: playlist.cover_url ?? undefined,
    tracks,
  };
}

async function pushPlaylist(id: string): Promise<void> {
  const payload = await buildCloudPlaylist(id);
  if (!payload) return;
  await upsertCloudPlaylist(payload);
  writeSnapshot(id, payload.tracks);
}

async function pushAllPlaylists(): Promise<void> {
  for (const playlist of await getPlaylists()) await pushPlaylist(playlist.id);
}

const playlistTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Backs up a playlist after a change (create, rename, cover, tracks).
 * Debounced, so adding ten tracks in a row sends one request.
 */
export function syncPlaylist(id: string): void {
  const timer = playlistTimers.get(id);
  if (timer) clearTimeout(timer);
  playlistTimers.set(
    id,
    setTimeout(() => {
      playlistTimers.delete(id);
      void (async () => {
        try {
          if (!(await hasAuthToken())) return;
          if (!(await ownsLocalLibrary(signedInUserId))) return;
          await pushPlaylist(id);
        } catch (error) {
          logSyncError('playlist queued', error);
          await addPending({ playlists: [id] });
        }
      })();
    }, 1500),
  );
}

export async function syncDeletedPlaylist(id: string): Promise<void> {
  const timer = playlistTimers.get(id);
  if (timer) clearTimeout(timer);
  playlistTimers.delete(id);
  AsyncStorage.removeItem(SNAPSHOT_PREFIX + id).catch(() => {});
  try {
    if (!(await hasAuthToken())) return;
    if (!(await ownsLocalLibrary(signedInUserId))) return;
    await deleteCloudPlaylist(id);
  } catch (error) {
    logSyncError('playlist delete queued', error);
    await addPending({ deletedPlaylists: [id] });
  }
}

/**
 * Brings back backed-up playlists that this phone doesn't have (reinstall,
 * new phone). Their tracks show up as they are downloaded again.
 */
export async function restorePlaylistsFromCloud(): Promise<number> {
  const local = new Set((await getPlaylists()).map((p) => p.id));
  const cloud = await getCloudPlaylists();
  let restored = 0;
  for (const playlist of cloud) {
    if (local.has(playlist.clientId)) continue;
    const ids = playlist.tracks.map((t) => cloudTrackToTrack(t).id);
    await restorePlaylist(
      playlist.clientId,
      playlist.name,
      playlist.coverUrl ?? null,
      ids,
    );
    writeSnapshot(playlist.clientId, playlist.tracks);
    restored++;
  }
  return restored;
}

async function flushPending(): Promise<void> {
  const pending = await readPending();
  if (
    pending.removed.length === 0 &&
    pending.playlists.length === 0 &&
    pending.deletedPlaylists.length === 0
  ) {
    return;
  }
  for (const part of chunks(pending.removed)) await removeCloudDownloads(part);
  for (const id of pending.deletedPlaylists) await deleteCloudPlaylist(id);
  for (const id of pending.playlists) await pushPlaylist(id);
  await AsyncStorage.removeItem(PENDING_KEY);
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
  // Pulling another account's history into this library would leak it the
  // other way, on the owner's next push.
  if (!(await ownsLocalLibrary(signedInUserId))) return;
  // Playlist and delete endpoints are newer than some servers: a failure
  // there must not stop the downloads/history sync.
  await flushPending().catch((e) => logSyncError('pending kept', e));
  await pullRecentlyPlayed();
  await restorePlaylistsFromCloud().catch((e) =>
    logSyncError('playlist restore skipped', e),
  );
  await pushLocalLibrary();
  await pushAllPlaylists().catch((e) => logSyncError('playlists skipped', e));
}

export function runInitialLibrarySync(userId: string): void {
  signedInUserId = userId;
  if (initialSyncInFlight) return;

  initialSyncInFlight = syncInitialLibrary()
    .catch((error) => logSyncError('initial sync skipped', error))
    .finally(() => {
      initialSyncInFlight = null;
    });
}

setPlaylistListener((playlistId, deleted) => {
  if (deleted) void syncDeletedPlaylist(playlistId);
  else syncPlaylist(playlistId);
});
