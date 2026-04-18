export const SOURCES = {
  youtube: { label: "YouTube", badge: "YT" },
  deezer: { label: "Deezer", badge: "DZR" },
  soundcloud: { label: "SoundCloud", badge: "SC" },
  spotify: { label: "Spotify", badge: "SP" },
} as const;

export type SourceKey = keyof typeof SOURCES;
