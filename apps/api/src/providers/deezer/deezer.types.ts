export interface DeezerAlbum {
  id: number;
  title: string;
  link: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  md5_image: string;
  release_date: string;
  tracklist: string;
  type: 'album';
}

export interface DeezerArtist {
  id: number;
  name: string;
  link: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  tracklist: string;
  type: 'artist';
}

export interface DeezerContributor {
  id: number;
  name: string;
  link: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  tracklist: string;
  type: 'artist';
  role: string;
}

export interface DeezerTrack {
  id: number;
  title: string;
  title_short: string;
  isrc: string;
  link: string;
  duration: number;
  rank: number;
  explicit_lyrics: boolean;
  preview: string;
  md5_image: string;
  artist: DeezerArtist;
  album: DeezerAlbum;
  type: 'track';
}

export interface DeezerTrackFull {
  id: number;
  title: string;
  title_short: string;
  isrc: string;
  link: string;
  duration: number;
  track_position: number;
  disk_number: number;
  rank: number;
  release_date: string;
  explicit_lyrics: boolean;
  preview: string;
  bpm: number;
  gain: number;
  contributors: DeezerContributor[];
  md5_image: string;
  artist: DeezerArtist;
  album: DeezerAlbum;
  type: 'track';
}

export interface DeezerSearchResponse {
  data: DeezerTrack[];
  total: number;
}
