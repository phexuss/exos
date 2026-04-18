import type { SourceKey } from "@/constants/sources";

export type Artist = {
  id: string;
  name: string;
};

export type Track = {
  id: string;
  title: string;
  artist: Artist;
  duration: string;
  coverUrl?: string;
  source: SourceKey;
  bitrate?: string;
  liked?: boolean;
  lyrics?: string[];
};

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  tracksCount: number;
  source: SourceKey;
};

export type UserProfile = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  followers: number;
  following: number;
};
