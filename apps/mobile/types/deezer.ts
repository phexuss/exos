export interface DeezerArtist {
  id: number;
  name: string;
  picture_medium?: string;
  picture_big?: string;
}

export interface DeezerAlbum {
  id: number;
  title: string;
  cover_medium?: string;
  cover_big?: string;
}

export interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string;
  isrc?: string;
  artist: DeezerArtist;
  album: DeezerAlbum;
  type: 'track';
}

export interface DeezerSearchResponse {
  data: DeezerTrack[];
  total: number;
}

export interface DeezerChartResponse {
  tracks: { data: DeezerTrack[] };
  albums: { data: DeezerAlbum[] };
  artists: { data: DeezerArtist[] };
}
