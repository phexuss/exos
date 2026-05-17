export interface DeezerArtistDetails {
  id: number;
  name: string;
  link: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  nb_album?: number;
  nb_fan?: number;
  share?: string;
  radio?: boolean;
  tracklist: string;
  type: 'artist';
}

export interface DeezerAlbumItem {
  id: number;
  title: string;
  link: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  release_date: string;
  tracklist: string;
  type: 'album';
}

export interface DeezerAlbumListResponse {
  data: DeezerAlbumItem[];
  total: number;
  next?: string;
}

export type ArtistDetails = {
  id: string;
  name: string;
  pictureUrl: string;
  pictureUrlLarge: string;
  fanCount: number;
  albumCount: number;
};

export type ArtistAlbum = {
  id: string;
  title: string;
  coverUrl: string;
  releaseDate: string;
};
