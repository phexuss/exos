import type { SoundCloudTrack } from '@/types/soundcloud';
import type { Track } from '@/types/domain';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getBestThumbnail(
  thumbnails?: { url: string; resolution?: string }[],
): string | undefined {
  if (!thumbnails || thumbnails.length === 0) return undefined;
  // Prefer t500x500, then original, then last (highest quality)
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
    previewUrl: undefined, // SC plays full track, no preview concept
    source: 'soundcloud',
    // webpage_url is used by download service to resolve stream via yt-dlp
    isrc: sc.webpage_url,
  };
}
