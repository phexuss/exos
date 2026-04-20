export interface SoundCloudThumbnail {
  id: string;
  url: string;
  width?: number;
  height?: number;
  resolution?: string;
}

export interface SoundCloudTrack {
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
  data: SoundCloudTrack[];
  total: number;
}
