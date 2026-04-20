import type { DeezerTrack } from '@/types/deezer';
import type { Track } from '@/types/domain';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function mapDeezerTrackToTrack(dt: DeezerTrack): Track {
  return {
    id: String(dt.id),
    title: dt.title,
    artist: {
      id: String(dt.artist.id),
      name: dt.artist.name,
    },
    album: dt.album.title,
    duration: formatDuration(dt.duration),
    durationSec: dt.duration,
    coverUrl: dt.album.cover_big ?? dt.album.cover_medium,
    previewUrl: dt.preview,
    isrc: dt.isrc,
    source: 'deezer',
  };
}
