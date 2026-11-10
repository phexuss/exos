import type { Track } from '@/types/domain';

/**
 * Artist pages are keyed by one string: a bare Deezer id, or `sc:<user id>`
 * (`sc:@<profile name>` when only the track URL knows who uploaded it) for
 * SoundCloud, whose profiles the phone fetches itself.
 */
export const SC_PREFIX = 'sc:';

/** The SoundCloud user ref behind an artist page id, or null for Deezer. */
export function scRef(id: string): string | null {
  return id.startsWith(SC_PREFIX) ? id.slice(SC_PREFIX.length) : null;
}

/** Profile names that are site sections, not people. */
const NOT_PROFILES = new Set(['discover', 'search', 'stream', 'you', 'sets']);

/** The profile name in a SoundCloud track URL, or null. */
export function profileFromTrackUrl(url?: string): string | null {
  const who = /^https?:\/\/(?:www\.|m\.)?soundcloud\.com\/([\w-]+)\//i.exec(
    url ?? '',
  )?.[1];
  return who && !NOT_PROFILES.has(who.toLowerCase()) ? who : null;
}

/** The artist page a track's artist opens, or null when there is none. */
export function artistPageId(track: Track): string | null {
  const id = track.artist.id;
  if (track.source === 'deezer') return id || null;
  if (track.source !== 'soundcloud') return null;
  if (/^\d+$/.test(id)) return `${SC_PREFIX}${id}`;
  const who = profileFromTrackUrl(track.isrc);
  return who ? `${SC_PREFIX}@${who}` : null;
}
