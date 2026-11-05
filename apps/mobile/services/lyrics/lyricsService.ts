import { apiGet } from '@/services/api/client';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import type { LyricsData } from '@/services/db/database';
import { fetchLyricsDirect } from '@/services/engine/localEngine';

function primaryArtist(artist: string): string {
  return artist.split(/\s*[&,]\s*|\s+feat\.?\s+|\s+ft\.?\s+/i)[0].trim();
}

/** LRCLIB straight from the phone, then the API as a fallback. */
export async function fetchLyrics(
  artist: string,
  title: string,
  duration: number,
): Promise<LyricsData | null> {
  const direct = await fetchLyricsDirect(
    primaryArtist(artist),
    title,
    duration,
  );
  if (direct?.syncedLyrics || direct?.plainLyrics) {
    return {
      syncedLyrics: direct.syncedLyrics ?? null,
      plainLyrics: direct.plainLyrics ?? null,
    };
  }
  try {
    const data = await apiGet<{ syncedLyrics?: string; plainLyrics?: string }>(
      API_ENDPOINTS.lyrics,
      {
        artist: primaryArtist(artist),
        track: title,
        duration: String(duration),
      },
    );
    return {
      syncedLyrics: data.syncedLyrics ?? null,
      plainLyrics: data.plainLyrics ?? null,
    };
  } catch {
    return null;
  }
}

const cache = new Map<string, Promise<LyricsData | null>>();

/**
 * Lyrics for a streamed track, one lookup per track per session. A failed
 * lookup is forgotten so the next play can retry.
 */
export function lyricsForTrack(
  id: string,
  artist: string,
  title: string,
  duration: number,
): Promise<LyricsData | null> {
  const hit = cache.get(id);
  if (hit) return hit;
  const pending = fetchLyrics(artist, title, duration).then((lyrics) => {
    if (!lyrics?.syncedLyrics && !lyrics?.plainLyrics) cache.delete(id);
    return lyrics;
  });
  cache.set(id, pending);
  return pending;
}
