// cache-manager v7 takes TTLs in milliseconds.
const HOUR_MS = 60 * 60 * 1000;

export const CACHE_TTL_MS = {
  default: 24 * HOUR_MS,
  chart: HOUR_MS,
  similar: HOUR_MS,
  lastfmSimilar: 24 * HOUR_MS,
  deezerMatch: 24 * HOUR_MS,
  lyrics: 7 * 24 * HOUR_MS,
  lyricsMissing: 6 * HOUR_MS,
} as const;
