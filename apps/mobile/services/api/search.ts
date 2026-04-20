import { mapDeezerTrackToTrack } from '@/services/adapters/search.adapter';
import { mapSoundCloudTrackToTrack } from '@/services/adapters/soundcloud.adapter';
import { apiGet } from '@/services/api/client';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import type { DeezerSearchResponse } from '@/types/deezer';
import type { Track } from '@/types/domain';
import type { SoundCloudSearchResponse } from '@/types/soundcloud';

export async function searchTracks(query: string): Promise<Track[]> {
  const data = await apiGet<DeezerSearchResponse>(API_ENDPOINTS.search, {
    q: query,
  });
  return data.data.map(mapDeezerTrackToTrack);
}

export async function searchSoundCloud(query: string): Promise<Track[]> {
  const data = await apiGet<SoundCloudSearchResponse>(
    API_ENDPOINTS.searchSoundCloud,
    { q: query },
  );
  return data.data.map(mapSoundCloudTrackToTrack);
}
