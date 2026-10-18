import { ApiError, apiDelete, apiGet, apiPost } from '@/services/api/client';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import type { DeezerTrack } from '@/types/deezer';

/** Pseudo playlist id the API uses for Liked Songs. */
export const SPOTIFY_LIKED_ID = 'liked';

export type SpotifyStatus = {
  configured: boolean;
  connected: boolean;
  displayName: string | null;
};

export type SpotifyPlaylist = {
  id: string;
  name: string;
  coverUrl: string | null;
  total: number;
  /** Spotify only shares tracks of playlists the user owns or collaborates on. */
  readable: boolean;
};

export type SpotifyImportPage = {
  total: number;
  nextOffset: number | null;
  tracks: DeezerTrack[];
  unmatched: { title: string; artist: string }[];
};

export function getSpotifyStatus(): Promise<SpotifyStatus> {
  return apiGet<SpotifyStatus>(`${API_ENDPOINTS.spotify}/status`);
}

export async function getSpotifyConnectUrl(): Promise<string> {
  const { url } = await apiPost<{ url: string }>(
    `${API_ENDPOINTS.spotify}/connect`,
    {},
  );
  return url;
}

export function disconnectSpotify(): Promise<void> {
  return apiDelete<void>(`${API_ENDPOINTS.spotify}/connection`);
}

export function getSpotifyPlaylists(): Promise<SpotifyPlaylist[]> {
  return apiGet<SpotifyPlaylist[]>(`${API_ENDPOINTS.spotify}/playlists`);
}

export function getSpotifyImportPage(
  playlistId: string,
  offset: number,
): Promise<SpotifyImportPage> {
  return apiGet<SpotifyImportPage>(
    `${API_ENDPOINTS.spotify}/playlists/${encodeURIComponent(playlistId)}/tracks`,
    { offset: String(offset) },
  );
}

/** The API answers 409 with this code when the account must be reconnected. */
export function isSpotifyNotConnected(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 409 &&
    (error.body as { code?: string } | null)?.code === 'SPOTIFY_NOT_CONNECTED'
  );
}
