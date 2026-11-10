/**
 * Home feed built from what was played on this phone, the same recipe as
 * the desktop Home: "Your artists" from local plays with a 14-day
 * half-life, and a mix of Last.fm picks and those artists' top tracks.
 */
import { getArtistTopTracks } from '@/services/api/artists';
import { getSimilarTracks, type SimilarTrack } from '@/services/api/similar';
import { artistPageId } from '@/services/artistPage';
import type { Track } from '@/types/domain';

const HALF_LIFE_MS = 14 * 24 * 3600_000;
const MIX_ARTISTS = 4;
const MIX_SIZE = 20;

export type YourArtist = {
  /** Artist page id (Deezer id or `sc:` ref): opens the artist page. */
  id: string;
  name: string;
  coverUrl?: string;
  score: number;
};

/**
 * Artists (Deezer and SoundCloud) from recent plays, ranked by plays that fade with age so
 * the list follows what you listen to now.
 */
export function yourArtists(recent: Track[], now = Date.now()): YourArtist[] {
  const byId = new Map<string, YourArtist>();
  for (const track of recent) {
    const id = artistPageId(track);
    if (!id) continue;
    const age = Math.max(0, now - (track.playedAt ?? now));
    const weight = 0.5 ** (age / HALF_LIFE_MS);
    const prev = byId.get(id);
    byId.set(id, {
      id,
      name: track.artist.name,
      coverUrl: prev?.coverUrl ?? track.coverUrl,
      score: (prev?.score ?? 0) + weight,
    });
  }
  return [...byId.values()].sort((a, b) => b.score - a.score);
}

export function similarToTrack(item: SimilarTrack): Track {
  const sec = item.duration ?? 0;
  return {
    id: String(item.deezerId),
    title: item.title,
    artist: { id: '', name: item.artist },
    coverUrl: item.coverUrl ?? undefined,
    duration: `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`,
    durationSec: sec,
    isrc: item.isrc ?? undefined,
    source: 'deezer',
  };
}

/** Round-robin over several lists, skipping ids already taken. */
function interleave(lists: Track[][], skip: Set<string>, limit: number) {
  const out: Track[] = [];
  const seen = new Set(skip);
  for (let i = 0; out.length < limit; i++) {
    let any = false;
    for (const list of lists) {
      const track = list[i];
      if (!track) continue;
      any = true;
      if (seen.has(track.id)) continue;
      seen.add(track.id);
      out.push(track);
      if (out.length === limit) break;
    }
    if (!any) break;
  }
  return out;
}

export type HomeFeed = {
  /** Last.fm picks for the latest play, shown on their own shelf. */
  similar: { seed: Track; tracks: Track[] } | null;
  mix: Track[];
};

/**
 * Similar tracks for the latest play, plus a mix of Last.fm picks for the
 * next two plays and the top tracks of your top artists. Each source fails
 * on its own; whatever loads is used.
 */
export async function loadHomeFeed(
  recent: Track[],
  artists: YourArtist[],
): Promise<HomeFeed> {
  const seeds = recent.slice(0, 3);
  const similarLists = await Promise.all(
    seeds.map((t) =>
      getSimilarTracks(t.artist.name, t.title)
        .then((list) => list.map(similarToTrack))
        .catch(() => [] as Track[]),
    ),
  );
  const topLists = await Promise.all(
    artists
      .slice(0, MIX_ARTISTS)
      .map((a) => getArtistTopTracks(a.id).catch(() => [] as Track[])),
  );

  const [first, ...restSimilar] = similarLists;
  const similar =
    seeds[0] && first && first.length > 0
      ? { seed: seeds[0], tracks: first.slice(0, 10) }
      : null;

  const skip = new Set<string>([
    ...recent.map((t) => t.id),
    ...(similar?.tracks.map((t) => t.id) ?? []),
  ]);
  const mix = interleave([...restSimilar, ...topLists], skip, MIX_SIZE);
  return { similar, mix };
}
