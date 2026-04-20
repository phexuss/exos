export const SOURCES = {
  youtube: { label: 'YouTube', badge: 'YT', color: '#FF0000' },
  deezer: { label: 'Deezer', badge: 'DZR', color: '#A238FF' },
  soundcloud: { label: 'SoundCloud', badge: 'SC', color: '#FE8140' },
  spotify: { label: 'Spotify', badge: 'SP', color: '#1DB954' },
} as const;

export type SourceKey = keyof typeof SOURCES;
