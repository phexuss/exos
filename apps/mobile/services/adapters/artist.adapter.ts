import type {
  ArtistAlbum,
  ArtistDetails,
  DeezerAlbumItem,
  DeezerArtistDetails,
} from '@/types/artist';

export function mapDeezerArtistToDetails(
  raw: DeezerArtistDetails,
): ArtistDetails {
  return {
    id: String(raw.id),
    name: raw.name,
    pictureUrl: raw.picture_big ?? raw.picture_medium ?? raw.picture,
    pictureUrlLarge: raw.picture_xl ?? raw.picture_big ?? raw.picture,
    fanCount: raw.nb_fan ?? 0,
    albumCount: raw.nb_album ?? 0,
  };
}

export function mapDeezerAlbumToCard(raw: DeezerAlbumItem): ArtistAlbum {
  return {
    id: String(raw.id),
    title: raw.title,
    coverUrl: raw.cover_big ?? raw.cover_medium ?? raw.cover,
    releaseDate: raw.release_date ?? '',
  };
}
