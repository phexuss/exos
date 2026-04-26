import {
  mapDeezerAlbumToCard,
  mapDeezerArtistToDetails,
} from '@/services/adapters/artist.adapter';
import { mapDeezerTrackToTrack } from '@/services/adapters/search.adapter';
import { apiGet } from '@/services/api/client';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import type {
  ArtistAlbum,
  ArtistDetails,
  DeezerAlbumListResponse,
  DeezerArtistDetails,
} from '@/types/artist';
import type { DeezerSearchResponse } from '@/types/deezer';
import type { Track } from '@/types/domain';

export async function getArtist(id: string): Promise<ArtistDetails> {
  const raw = await apiGet<DeezerArtistDetails>(
    `${API_ENDPOINTS.artists}/${id}`,
  );
  return mapDeezerArtistToDetails(raw);
}

export async function getArtistTopTracks(id: string): Promise<Track[]> {
  const raw = await apiGet<DeezerSearchResponse>(
    `${API_ENDPOINTS.artists}/${id}/tracks`,
  );
  return raw.data.map(mapDeezerTrackToTrack);
}

export async function getArtistAlbums(id: string): Promise<ArtistAlbum[]> {
  const raw = await apiGet<DeezerAlbumListResponse>(
    `${API_ENDPOINTS.artists}/${id}/albums`,
  );
  return raw.data.map(mapDeezerAlbumToCard);
}
