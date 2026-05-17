import { apiGet } from '@/services/api/client';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import type { Track } from '@/types/domain';

interface DeezerAlbumDetailRaw {
  id: number;
  title: string;
  cover_medium?: string;
  cover_big?: string;
  cover?: string;
  artist?: { id: number; name: string };
  tracks?: {
    data: {
      id: number;
      title: string;
      duration: number;
      preview: string;
      isrc?: string;
      artist: { id: number; name: string };
    }[];
  };
}

function fmtDur(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface AlbumDetail {
  id: string;
  title: string;
  coverUrl: string;
  artistName: string;
  artistId: string;
  tracks: Track[];
}

export async function getAlbumDetail(albumId: string): Promise<AlbumDetail> {
  const raw = await apiGet<DeezerAlbumDetailRaw>(
    `${API_ENDPOINTS.albums}/${albumId}`,
  );

  const cover = raw.cover_big ?? raw.cover_medium ?? raw.cover ?? '';

  const tracks: Track[] = (raw.tracks?.data ?? []).map((t) => ({
    id: String(t.id),
    title: t.title,
    artist: { id: String(t.artist.id), name: t.artist.name },
    album: raw.title,
    duration: fmtDur(t.duration),
    durationSec: t.duration,
    coverUrl: cover,
    previewUrl: t.preview,
    isrc: t.isrc,
    source: 'deezer' as const,
  }));

  return {
    id: String(raw.id),
    title: raw.title,
    coverUrl: cover,
    artistName: raw.artist?.name ?? '',
    artistId: String(raw.artist?.id ?? ''),
    tracks,
  };
}
