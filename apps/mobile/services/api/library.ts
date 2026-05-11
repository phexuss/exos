import type { SourceKey } from '@/constants/sources';
import { apiGet, apiPost } from '@/services/api/client';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import type { Track } from '@/types/domain';

export type CloudLibraryTrack = {
  trackId?: string;
  deezerId?: string;
  scUrl?: string;
  source?: Extract<SourceKey, 'deezer' | 'soundcloud'> | null;
  title: string;
  artistName: string;
  artistId?: string;
  album?: string;
  coverUrl?: string;
  duration: string;
  durationSec: number;
  previewUrl?: string;
  isrc?: string;
  addedAt?: string;
  playedAt?: string;
};

type BulkResponse = {
  count: number;
};

type SyncSource = Extract<SourceKey, 'deezer' | 'soundcloud'>;

function isSyncableSource(source: SourceKey): source is SyncSource {
  return source === 'deezer' || source === 'soundcloud';
}

function normalizeCloudSource(
  track: Pick<CloudLibraryTrack, 'source' | 'deezerId' | 'scUrl' | 'isrc'>,
): SyncSource {
  if (track.source === 'deezer' || track.source === 'soundcloud') {
    return track.source;
  }
  return track.deezerId ? 'deezer' : 'soundcloud';
}

function timestampToIso(timestamp?: number): string | undefined {
  return timestamp ? new Date(timestamp).toISOString() : undefined;
}

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function getCloudTrackId(track: CloudLibraryTrack): string {
  if (track.trackId) return track.trackId;
  if (track.deezerId) return track.deezerId;
  if (track.scUrl) return `sc_${hashString(track.scUrl)}`;
  return `${track.source}-0`;
}

export function trackToCloudTrack(
  track: Track,
  timestamp?: { addedAt?: number; playedAt?: number },
): CloudLibraryTrack | null {
  if (!isSyncableSource(track.source)) return null;

  const deezerId = track.source === 'deezer' ? track.id : undefined;
  const scUrl = track.source === 'soundcloud' ? track.isrc : undefined;

  if (!deezerId && !scUrl) return null;

  return {
    trackId: track.id,
    deezerId,
    scUrl,
    source: track.source,
    title: track.title,
    artistName: track.artist.name,
    artistId: track.artist.id || undefined,
    album: track.album,
    coverUrl: track.coverUrl,
    duration: track.duration,
    durationSec: track.durationSec,
    previewUrl: track.previewUrl,
    isrc: track.isrc,
    addedAt: timestampToIso(timestamp?.addedAt ?? track.downloadedAt),
    playedAt: timestampToIso(timestamp?.playedAt ?? track.playedAt),
  };
}

export function cloudTrackToTrack(track: CloudLibraryTrack): Track {
  const source = normalizeCloudSource(track);

  return {
    id: getCloudTrackId(track),
    title: track.title,
    artist: {
      id: track.artistId ?? '',
      name: track.artistName,
    },
    album: track.album,
    duration: track.duration,
    durationSec: track.durationSec,
    coverUrl: track.coverUrl,
    previewUrl: track.previewUrl,
    isrc: track.isrc ?? track.scUrl,
    source,
    downloadedAt: track.addedAt ? Date.parse(track.addedAt) : undefined,
    playedAt: track.playedAt ? Date.parse(track.playedAt) : undefined,
  };
}

export function getCloudDownloads(limit = 500): Promise<CloudLibraryTrack[]> {
  return apiGet<CloudLibraryTrack[]>(`${API_ENDPOINTS.library}/downloads`, {
    limit: String(limit),
  });
}

export function upsertCloudDownload(
  track: CloudLibraryTrack,
): Promise<CloudLibraryTrack> {
  return apiPost<CloudLibraryTrack>(
    `${API_ENDPOINTS.library}/downloads`,
    track,
  );
}

export function upsertCloudDownloadsBulk(
  tracks: CloudLibraryTrack[],
): Promise<BulkResponse> {
  return apiPost<BulkResponse>(`${API_ENDPOINTS.library}/downloads/bulk`, {
    tracks,
  });
}

export function getCloudRecentlyPlayed(
  limit = 100,
): Promise<CloudLibraryTrack[]> {
  return apiGet<CloudLibraryTrack[]>(`${API_ENDPOINTS.library}/recent`, {
    limit: String(limit),
  });
}

export function upsertCloudRecentlyPlayed(
  track: CloudLibraryTrack,
): Promise<CloudLibraryTrack> {
  return apiPost<CloudLibraryTrack>(`${API_ENDPOINTS.library}/recent`, track);
}

export function upsertCloudRecentlyPlayedBulk(
  tracks: CloudLibraryTrack[],
): Promise<BulkResponse> {
  return apiPost<BulkResponse>(`${API_ENDPOINTS.library}/recent/bulk`, {
    tracks,
  });
}
