import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class SoundCloudThumbnailDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiPropertyOptional()
  width?: number;

  @ApiPropertyOptional()
  height?: number;

  @ApiPropertyOptional()
  resolution?: string;
}

export class SoundCloudFormatDto {
  @ApiProperty()
  url!: string;

  @ApiProperty()
  format_id!: string;

  @ApiProperty()
  protocol!: string;

  @ApiProperty()
  ext!: string;

  @ApiPropertyOptional()
  acodec?: string;

  @ApiPropertyOptional()
  abr?: number;
}

export class SoundCloudTrackInfoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  uploader!: string;

  @ApiProperty()
  uploader_id!: string;

  @ApiProperty()
  uploader_url!: string;

  @ApiProperty()
  duration!: number;

  @ApiProperty()
  webpage_url!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  view_count?: number;

  @ApiPropertyOptional()
  like_count?: number;

  @ApiPropertyOptional()
  repost_count?: number;

  @ApiPropertyOptional({ type: [String] })
  genres?: string[];

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ type: [String] })
  artists?: string[];

  @ApiPropertyOptional({ type: () => [SoundCloudThumbnailDto] })
  thumbnails?: SoundCloudThumbnailDto[];

  @ApiPropertyOptional({ type: () => [SoundCloudFormatDto] })
  formats?: SoundCloudFormatDto[];
}

export class SoundCloudSearchResultDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  uploader!: string;

  @ApiProperty()
  uploader_id!: string;

  @ApiProperty()
  uploader_url!: string;

  @ApiProperty()
  duration!: number;

  @ApiProperty()
  webpage_url!: string;

  @ApiPropertyOptional()
  view_count?: number;

  @ApiPropertyOptional()
  like_count?: number;

  @ApiPropertyOptional({ type: () => [SoundCloudThumbnailDto] })
  thumbnails?: SoundCloudThumbnailDto[];
}

export class SoundCloudSearchResponseDto {
  @ApiProperty({ type: () => [SoundCloudSearchResultDto] })
  data!: SoundCloudSearchResultDto[];

  @ApiProperty()
  total!: number;
}
