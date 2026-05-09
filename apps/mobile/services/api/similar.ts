import { apiGet } from './client';

export interface SimilarTrack {
  title: string;
  artist: string;
  match: number;
  coverUrl: string | null;
  duration: number | null;
  isrc: string | null;
  deezerId: number;
}

export async function getSimilarTracks(
  artist: string,
  track: string,
): Promise<SimilarTrack[]> {
  return apiGet<SimilarTrack[]>('/search/similar', {
    artist,
    track,
  });
}
