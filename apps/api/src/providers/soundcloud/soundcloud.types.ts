export interface SoundCloudThumbnail {
  id: string;
  url: string;
  width?: number;
  height?: number;
  resolution?: string;
}

export interface SoundCloudFormat {
  url: string;
  format_id: string;
  protocol: string;
  ext: string;
  acodec?: string;
  abr?: number;
}

export interface SoundCloudTrackInfo {
  id: string;
  title: string;
  uploader: string;
  uploader_id: string;
  uploader_url: string;
  duration: number;
  webpage_url: string;
  description?: string;
  view_count?: number;
  like_count?: number;
  repost_count?: number;
  genres?: string[];
  tags?: string[];
  artists?: string[];
  thumbnails?: SoundCloudThumbnail[];
  formats?: SoundCloudFormat[];
}

export interface SoundCloudSearchResult {
  id: string;
  title: string;
  uploader: string;
  uploader_id: string;
  uploader_url: string;
  duration: number;
  webpage_url: string;
  view_count?: number;
  like_count?: number;
  thumbnails?: SoundCloudThumbnail[];
}

export interface SoundCloudSearchResponse {
  data: SoundCloudSearchResult[];
  total: number;
}
