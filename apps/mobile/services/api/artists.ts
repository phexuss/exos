import {
  mapDeezerAlbumToCard,
  mapDeezerArtistToDetails,
} from '@/services/adapters/artist.adapter';
import { mapDeezerTrackToTrack } from '@/services/adapters/search.adapter';
import { mapSoundCloudTrackToTrack } from '@/services/adapters/soundcloud.adapter';
import { apiGet } from '@/services/api/client';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import { scRef } from '@/services/artistPage';
import {
  soundCloudUser,
  soundCloudUserTopTracks,
  soundCloudUserUploads,
} from '@/services/engine/soundcloudDirect';
import type {
  ArtistAlbum,
  ArtistDetails,
  DeezerAlbumListResponse,
  DeezerArtistDetails,
} from '@/types/artist';
import type { DeezerSearchResponse } from '@/types/deezer';
import type { Track } from '@/types/domain';

// SoundCloud artists (`sc:` ids) come straight from SoundCloud, from the
// phone's own IP, like the desktop app; Deezer ones through the EXØS API.

export async function getArtist(id: string): Promise<ArtistDetails> {
  const sc = scRef(id);
  if (sc !== null) {
    const user = await soundCloudUser(sc);
    return {
      id,
      name: user.name,
      pictureUrl: user.pictureUrl ?? '',
      pictureUrlLarge: user.pictureUrl ?? '',
      fanCount: user.followers,
      albumCount: 0,
      source: 'soundcloud',
      trackCount: user.trackCount,
    };
  }
  const raw = await apiGet<DeezerArtistDetails>(
    `${API_ENDPOINTS.artists}/${id}`,
  );
  return mapDeezerArtistToDetails(raw);
}

export async function getArtistTopTracks(id: string): Promise<Track[]> {
  const sc = scRef(id);
  if (sc !== null) {
    return (await soundCloudUserTopTracks(sc)).map(mapSoundCloudTrackToTrack);
  }
  const raw = await apiGet<DeezerSearchResponse>(
    `${API_ENDPOINTS.artists}/${id}/tracks`,
  );
  return raw.data.map(mapDeezerTrackToTrack);
}

/** A SoundCloud artist's uploads, newest first; Deezer artists have none. */
export async function getArtistUploads(id: string): Promise<Track[]> {
  const sc = scRef(id);
  if (sc === null) return [];
  return (await soundCloudUserUploads(sc)).map(mapSoundCloudTrackToTrack);
}

export async function getArtistAlbums(id: string): Promise<ArtistAlbum[]> {
  if (scRef(id) !== null) return [];
  const raw = await apiGet<DeezerAlbumListResponse>(
    `${API_ENDPOINTS.artists}/${id}/albums`,
  );
  return raw.data.map(mapDeezerAlbumToCard);
}
