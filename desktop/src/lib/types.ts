export type Source = 'deezer' | 'soundcloud';

export type Artist = { id: string; name: string };

export type Track = {
  id: string;
  title: string;
  artist: Artist;
  album?: string;
  albumId?: string;
  durationSec: number;
  coverUrl?: string;
  previewUrl?: string;
  /** ISRC for Deezer tracks, the track page URL for SoundCloud ones. */
  isrc?: string;
  source: Source;
};

export type LocalTrack = Track & {
  filePath: string;
  format: string;
  downloadedAt: number;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
};

export type AlbumCard = {
  id: string;
  title: string;
  coverUrl?: string;
  artistName?: string;
  year?: string;
};

export type ArtistCard = { id: string; name: string; pictureUrl?: string };

export type ArtistDetails = ArtistCard & { fans?: number; albumsCount?: number };

export type AlbumDetail = AlbumCard & { artistId: string; tracks: Track[] };

export type Chart = { tracks: Track[]; albums: AlbumCard[]; artists: ArtistCard[] };

export type SimilarTrack = Track & { match: number };

export type Lyrics = { syncedLyrics?: string | null; plainLyrics?: string | null };

/** Lyrics the user set for a track by hand; title and artist only make lyrics.json readable. */
export type UserLyrics = Lyrics & { id: string; title: string; artist: string; updatedAt: number };

/** One entry from LRCLIB's search. */
export type LrcLibEntry = Lyrics & {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string | null;
  duration?: number | null;
  instrumental?: boolean;
};

export type User = { id: string; name: string; username: string; email: string };

/** A playlist kept on this computer; tracks are snapshots, playable whether downloaded or not. */
export type Playlist = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  tracks: Track[];
};
