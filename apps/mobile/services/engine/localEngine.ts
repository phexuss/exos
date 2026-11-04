/**
 * On-device audio engine: yt-dlp runs on the phone (modules/exos-ytdlp) and
 * every request leaves from the user's own IP, like the desktop engine. The
 * EXØS server is only a fallback when this fails.
 */
import {
  downloadYtdlp,
  isYtdlpAvailable,
  resolveYtdlp,
  type YtdlpFormat,
  type YtdlpInfo,
} from '@/modules/exos-ytdlp';
import type { Track } from '@/types/domain';

export const isLocalEngineAvailable = isYtdlpAvailable;

/**
 * android_vr returns plain m4a links without the JS challenge; measured on
 * a phone at ~3.7 s vs ~7.6 s for yt-dlp's default client mix. Some videos
 * (age-gated, music-only) need the default clients, hence the retry.
 */
const FAST_YOUTUBE_ARGS = [
  '--extractor-args',
  'youtube:player_client=android_vr',
];

const YOUTUBE_FORMAT =
  'bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio[protocol^=http]/bestaudio';
// Progressive mp3 is gone for most SoundCloud tracks; HLS AAC is next.
const SOUNDCLOUD_FORMAT =
  'http_mp3_128_url/bestaudio[protocol^=http][ext=mp3]/bestaudio[protocol^=http]/bestaudio[acodec^=mp4a]/bestaudio[ext=m4a]/bestaudio';

// googlevideo links live ~6 h; SoundCloud's signed links only minutes.
const YOUTUBE_TTL_MS = 4 * 60 * 60 * 1000;
const SOUNDCLOUD_TTL_MS = 4 * 60 * 1000;

export type LocalStream = {
  url: string;
  headers: Record<string, string>;
  hls: boolean;
  contentType?: string;
};

function isSoundCloudUrl(value: string | undefined): boolean {
  return !!value && /^https?:\/\/([a-z0-9-]+\.)*soundcloud\.com\//i.test(value);
}

/** What yt-dlp should fetch for this track (desktop: resolveSource). */
export function localSource(track: Track): string {
  // SoundCloud tracks carry their page URL in `isrc` (see soundcloud.adapter).
  if (track.isrc && isSoundCloudUrl(track.isrc)) return track.isrc;
  const isrc = track.isrc?.trim();
  if (isrc && isrc.length === 12) return `ytsearch1:${isrc}`;
  return `ytsearch1:${track.artist.name} ${track.title}`;
}

function argsFor(source: string, fast: boolean): string[] {
  return fast && !isSoundCloudUrl(source) ? FAST_YOUTUBE_ARGS : [];
}

function formatFor(source: string): string {
  return isSoundCloudUrl(source) ? SOUNDCLOUD_FORMAT : YOUTUBE_FORMAT;
}

let jobCounter = 0;
const nextJobId = (kind: string) => `${kind}-${Date.now()}-${++jobCounter}`;

/** Runs `run` with the fast YouTube client, then once more with the default. */
async function withFallback<T>(
  source: string,
  run: (args: string[]) => Promise<T>,
): Promise<T> {
  const fast = argsFor(source, true);
  if (fast.length === 0) return run([]);
  try {
    return await run(fast);
  } catch (error) {
    console.warn('[LocalEngine] android_vr failed, retrying default:', error);
    return run([]);
  }
}

function pickFormat(info: YtdlpInfo): YtdlpFormat {
  return info.requested_formats?.[0] ?? info;
}

function toStream(info: YtdlpInfo): LocalStream {
  const fmt = pickFormat(info);
  if (!fmt.url) throw new Error('yt-dlp returned no audio URL');
  const protocol = fmt.protocol ?? '';
  const hls = protocol.includes('m3u8');
  const ext = fmt.ext ?? info.ext;
  return {
    url: fmt.url,
    headers: fmt.http_headers ?? info.http_headers ?? {},
    hls,
    contentType: hls
      ? undefined
      : ext === 'mp3'
        ? 'audio/mpeg'
        : ext === 'webm'
          ? 'audio/webm'
          : 'audio/mp4',
  };
}

type CacheEntry = { at: number; ttl: number; stream: Promise<LocalStream> };
const streamCache = new Map<string, CacheEntry>();

/**
 * Direct audio URL for the track, resolved on the phone. Concurrent and
 * repeated calls share one yt-dlp run while the link is fresh, so a
 * prefetch for the next track makes skipping to it instant.
 */
export function resolveLocalStream(track: Track): Promise<LocalStream> {
  const source = localSource(track);
  const cached = streamCache.get(source);
  if (cached && Date.now() - cached.at < cached.ttl) return cached.stream;

  const stream = withFallback(source, (args) =>
    resolveYtdlp(nextJobId('resolve'), source, args, formatFor(source)),
  ).then(({ info }) => toStream(info));

  const entry: CacheEntry = {
    at: Date.now(),
    ttl: isSoundCloudUrl(source) ? SOUNDCLOUD_TTL_MS : YOUTUBE_TTL_MS,
    stream,
  };
  streamCache.set(source, entry);
  stream.catch(() => {
    if (streamCache.get(source) === entry) streamCache.delete(source);
  });
  return stream;
}

export function prefetchLocalStream(track: Track): void {
  resolveLocalStream(track).catch(() => {});
}

/**
 * Downloads the track's audio to `basePath` (absolute, no extension; yt-dlp
 * adds it) and returns the final path. `jobId` matches progress events.
 */
export async function downloadLocal(
  track: Track,
  jobId: string,
  basePath: string,
): Promise<{ path: string; ext: string }> {
  const source = localSource(track);
  const template = `${basePath}.%(ext)s`;
  const { info } = await withFallback(source, (args) =>
    downloadYtdlp(jobId, source, args, formatFor(source), template),
  );
  if (!info.filepath) throw new Error('yt-dlp returned no file');
  const ext = info.filepath.split('.').pop() ?? info.ext ?? 'm4a';
  return { path: info.filepath, ext };
}

type LrclibResult = {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
};

/** LRCLIB straight from the phone (the desktop does the same). */
export async function fetchLyricsDirect(
  artist: string,
  title: string,
  durationSec: number,
): Promise<LrclibResult | null> {
  const params = new URLSearchParams({
    artist_name: artist,
    track_name: title,
  });
  if (durationSec > 0) params.set('duration', String(Math.round(durationSec)));
  const headers = { 'User-Agent': 'EXOS (https://github.com/phexuss/exos)' };
  try {
    const exact = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers,
    });
    if (exact.ok) return (await exact.json()) as LrclibResult;
    const search = await fetch(
      `https://lrclib.net/api/search?${new URLSearchParams({ q: `${artist} ${title}` })}`,
      { headers },
    );
    if (!search.ok) return null;
    const results = (await search.json()) as LrclibResult[];
    return (
      results.find((r) => r.syncedLyrics) ??
      results.find((r) => r.plainLyrics) ??
      null
    );
  } catch {
    return null;
  }
}
