export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

export interface SpotifyUser {
  id: string;
  display_name: string | null;
}

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyTrack {
  id: string | null;
  name: string;
  type: 'track' | 'episode';
  duration_ms: number;
  is_local?: boolean;
  artists: { id: string | null; name: string }[];
  album?: { name: string; images: SpotifyImage[] };
  external_ids?: { isrc?: string };
}

/**
 * Playlist entry. Since the February 2026 Web API change the track sits in
 * `item`; `track` is still read so older apps that kept the legacy shape
 * keep working.
 */
export interface SpotifyPlaylistEntry {
  item?: SpotifyTrack | null;
  track?: SpotifyTrack | null;
  is_local?: boolean;
}

export interface SpotifySavedTrack {
  added_at: string;
  track: SpotifyTrack | null;
}

export interface SpotifyPage<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  next: string | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  collaborative: boolean;
  owner: { id: string };
  images: SpotifyImage[] | null;
  /** `items` after the February 2026 rename, `tracks` before it. */
  items?: { total: number } | null;
  tracks?: { total: number } | null;
}
