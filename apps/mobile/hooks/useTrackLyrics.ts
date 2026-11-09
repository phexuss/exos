import { useEffect, useState } from 'react';

import { lyricsForTrack } from '@/services/lyrics/lyricsService';
import { useUserLyricsStore } from '@/store/useUserLyricsStore';
import type { Track } from '@/types/domain';

type TrackLyrics = {
  syncedLyrics?: string;
  plainLyrics?: string;
  loading: boolean;
  /** Set by hand in the lyrics editor. */
  custom: boolean;
};

/**
 * Lyrics for the playing track: the ones set by hand in the editor, then the
 * ones saved with a download, otherwise looked up on LRCLIB as soon as the
 * track starts, like the desktop.
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
  const mine = useUserLyricsStore((s) => (id ? s.byId[id] : undefined));
  const loadMine = useUserLyricsStore((s) => s.load);
  const artist = track?.artist.name;
  const title = track?.title;

  useEffect(() => {
    if (id) loadMine(id);
  }, [id, loadMine]);

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

  if (!track) return { loading: false, custom: false };
  if (mine) {
    return {
      syncedLyrics: mine.syncedLyrics ?? undefined,
      plainLyrics: mine.plainLyrics ?? undefined,
      loading: false,
      custom: true,
    };
  }
  // Still checking for hand-set lyrics: a quick local read, worth waiting
  // for so found lyrics don't flash first.
  if (mine === undefined) return { loading: true, custom: false };
  if (saved) {
    return {
      syncedLyrics: track.syncedLyrics,
      plainLyrics: track.plainLyrics,
      loading: false,
      custom: false,
    };
  }
  if (fetched?.id === track.id) {
    return {
      syncedLyrics: fetched.syncedLyrics,
      plainLyrics: fetched.plainLyrics,
      loading: false,
      custom: false,
    };
  }
  return { loading: true, custom: false };
}
