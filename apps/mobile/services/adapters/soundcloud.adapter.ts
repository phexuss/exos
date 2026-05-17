import type { Track } from '@/types/domain';
import type { SoundCloudTrack } from '@/types/soundcloud';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getBestThumbnail(
  thumbnails?: { url: string; resolution?: string }[],
): string | undefined {
  if (!thumbnails || thumbnails.length === 0) return undefined;

  const preferred = thumbnails.find(
    (t) => t.resolution === 't500x500' || t.resolution === 'original',
  );
  return preferred?.url ?? thumbnails[thumbnails.length - 1]?.url;
}

export function mapSoundCloudTrackToTrack(sc: SoundCloudTrack): Track {
  return {
    id: `sc_${sc.id}`,
    title: sc.title,
    artist: {
      id: sc.uploader_id || sc.uploader,
      name: sc.uploader,
    },
    duration: formatDuration(sc.duration),
    durationSec: sc.duration,
    coverUrl: getBestThumbnail(sc.thumbnails),
    previewUrl: undefined,
    source: 'soundcloud',

    isrc: sc.webpage_url,
  };
}
