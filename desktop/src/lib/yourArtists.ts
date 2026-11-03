import { useMemo } from 'react';
import type { Track } from '@/lib/types';
import { useLibrary } from '@/store/library';
import { type ArtistStat, artistKey, decayed, statFor, usePlays } from '@/store/plays';
import { usePlaylists } from '@/store/playlists';

/**
 * Artists by plays, plus what is downloaded and in playlists (one play each,
 * dated when it got there), so a fresh install with a library is not empty.
 */
export function useYourArtists(limit: number): (ArtistStat & { key: string })[] {
  const artists = usePlays((s) => s.artists);
  const hidden = usePlays((s) => s.hidden);
  const library = useLibrary((s) => s.tracks);
  const playlists = usePlaylists((s) => s.playlists);
  return useMemo(() => {
    const now = Date.now();
    const all = new Map<string, ArtistStat>();
    for (const [key, a] of Object.entries(artists)) all.set(key, { ...a, score: decayed(a.score, a.last, now) });
    const seed = (track: Track, at: number) => {
      if (!track.artist.name.trim()) return;
      const key = artistKey(track);
      const prev = all.get(key);
      const score = (prev?.score ?? 0) + decayed(1, at, now);
      all.set(key, prev ? { ...prev, score, coverUrl: prev.coverUrl ?? track.coverUrl } : statFor(track, score, at));
    };
    for (const tr of library) seed(tr, tr.downloadedAt);
    for (const pl of playlists) for (const tr of pl.tracks) seed(tr, pl.updatedAt);
    const skip = new Set(hidden);
    return [...all.entries()]
      .filter(([key]) => !skip.has(key))
      .map(([key, a]) => ({ ...a, key }))
      .sort((a, b) => b.score - a.score || b.last - a.last)
      .slice(0, limit);
  }, [artists, hidden, library, playlists, limit]);
}
