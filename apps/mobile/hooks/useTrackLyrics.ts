import { useEffect, useState } from 'react';

import { lyricsForTrack } from '@/services/lyrics/lyricsService';
import type { Track } from '@/types/domain';

type TrackLyrics = {
  syncedLyrics?: string;
  plainLyrics?: string;
  loading: boolean;
};

/**
 * Lyrics for the playing track: the ones saved with a download, otherwise
 * looked up on LRCLIB as soon as the track starts, like the desktop.
 */
export function useTrackLyrics(
  track: Track | null | undefined,
  durationSec: number,
): TrackLyrics {
  const saved = !!(track?.syncedLyrics || track?.plainLyrics);
  const [fetched, setFetched] = useState<{
    id: string;
    syncedLyrics?: string;
    plainLyrics?: string;
  } | null>(null);

  const id = track?.id;
  const artist = track?.artist.name;
  const title = track?.title;

  useEffect(() => {
    if (!id || !artist || !title || saved) return;
    let alive = true;
    lyricsForTrack(id, artist, title, durationSec).then((lyrics) => {
      if (!alive) return;
      setFetched({
        id,
        syncedLyrics: lyrics?.syncedLyrics ?? undefined,
        plainLyrics: lyrics?.plainLyrics ?? undefined,
      });
    });
    return () => {
      alive = false;
    };
  }, [id, artist, title, durationSec, saved]);

  if (!track) return { loading: false };
  if (saved) {
    return {
      syncedLyrics: track.syncedLyrics,
      plainLyrics: track.plainLyrics,
      loading: false,
    };
  }
  if (fetched?.id === track.id) {
    return {
      syncedLyrics: fetched.syncedLyrics,
      plainLyrics: fetched.plainLyrics,
      loading: false,
    };
  }
  return { loading: true };
}
