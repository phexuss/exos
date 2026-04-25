import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface DeezerAlbum {
  id: number;
  title: string;
  link: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  md5_image: string;
  release_date: string;
  tracklist: string;
  type: 'album';
}

export interface DeezerArtist {
  id: number;
  name: string;
  link: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  tracklist: string;
  type: 'artist';
}

export interface DeezerContributor {
  id: number;
  name: string;
  link: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  tracklist: string;
  type: 'artist';
  role: string;
}

export interface DeezerTrack {
  id: number;
  title: string;
  title_short: string;
  isrc: string;
  link: string;
  duration: number;
  rank: number;
  explicit_lyrics: boolean;
  preview: string;
  md5_image: string;
  artist: DeezerArtist;
  album: DeezerAlbum;
  type: 'track';
}

export interface DeezerTrackFull {
  id: number;
  title: string;
  title_short: string;
  isrc: string;
  link: string;
  duration: number;
  track_position: number;
  disk_number: number;
  rank: number;
  release_date: string;
  explicit_lyrics: boolean;
  preview: string;
  bpm: number;
  gain: number;
  contributors: DeezerContributor[];
  md5_image: string;
  artist: DeezerArtist;
  album: DeezerAlbum;
  type: 'track';
}

export interface DeezerSearchResponse {
  data: DeezerTrack[];
  total: number;
}

export class DeezerAlbumDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  link!: string;

  @ApiProperty()
  cover!: string;

  @ApiProperty()
  cover_small!: string;

  @ApiProperty()
  cover_medium!: string;

  @ApiProperty()
  cover_big!: string;

  @ApiProperty()
  cover_xl!: string;

  @ApiProperty()
  md5_image!: string;

  @ApiProperty()
  release_date!: string;

  @ApiProperty()
  tracklist!: string;

  @ApiProperty({ enum: ['album'] })
  type!: 'album';
}

export class DeezerArtistDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  link!: string;

  @ApiProperty()
  picture!: string;

  @ApiProperty()
  picture_small!: string;

  @ApiProperty()
  picture_medium!: string;

  @ApiProperty()
  picture_big!: string;

  @ApiProperty()
  picture_xl!: string;

  @ApiProperty()
  tracklist!: string;

  @ApiProperty({ enum: ['artist'] })
  type!: 'artist';
}

export class DeezerArtistDetailsDto extends DeezerArtistDto {
  @ApiPropertyOptional()
  share?: string;

  @ApiPropertyOptional()
  radio?: boolean;

  @ApiPropertyOptional()
  nb_album?: number;

  @ApiPropertyOptional()
  nb_fan?: number;
}

export class DeezerContributorDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  link!: string;

  @ApiProperty()
  picture_small!: string;

  @ApiProperty()
  picture_medium!: string;

  @ApiProperty()
  picture_big!: string;

  @ApiProperty()
  picture_xl!: string;

  @ApiProperty()
  tracklist!: string;

  @ApiProperty({ enum: ['artist'] })
  type!: 'artist';

  @ApiProperty()
  role!: string;
}

export class DeezerTrackDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  title_short!: string;

  @ApiProperty()
  isrc!: string;

  @ApiProperty()
  link!: string;

  @ApiProperty()
  duration!: number;

  @ApiProperty()
  rank!: number;

  @ApiProperty()
  explicit_lyrics!: boolean;

  @ApiProperty()
  preview!: string;

  @ApiProperty()
  md5_image!: string;

  @ApiProperty({ type: () => DeezerArtistDto })
  artist!: DeezerArtistDto;

  @ApiProperty({ type: () => DeezerAlbumDto })
  album!: DeezerAlbumDto;

  @ApiProperty({ enum: ['track'] })
  type!: 'track';
}

export class DeezerTrackFullDto extends DeezerTrackDto {
  @ApiProperty()
  track_position!: number;

  @ApiProperty()
  disk_number!: number;

  @ApiProperty()
  release_date!: string;

  @ApiProperty()
  bpm!: number;

  @ApiProperty()
  gain!: number;

  @ApiProperty({ type: () => [DeezerContributorDto] })
  contributors!: DeezerContributorDto[];
}

export class DeezerTrackListResponseDto {
  @ApiProperty({ type: () => [DeezerTrackDto] })
  data!: DeezerTrackDto[];

  @ApiProperty()
  total!: number;

  @ApiPropertyOptional()
  next?: string;
}

export class DeezerAlbumListResponseDto {
  @ApiProperty({ type: () => [DeezerAlbumDto] })
  data!: DeezerAlbumDto[];

  @ApiProperty()
  total!: number;

  @ApiPropertyOptional()
  next?: string;
}

export class DeezerGenreDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  picture?: string;

  @ApiPropertyOptional()
  type?: string;
}

export class DeezerGenreListDto {
  @ApiProperty({ type: () => [DeezerGenreDto] })
  data!: DeezerGenreDto[];
}

export class DeezerAlbumDetailsDto extends DeezerAlbumDto {
  @ApiPropertyOptional()
  upc?: string;

  @ApiPropertyOptional()
  duration?: number;

  @ApiPropertyOptional()
  nb_tracks?: number;

  @ApiPropertyOptional()
  fans?: number;

  @ApiPropertyOptional()
  genre_id?: number;

  @ApiPropertyOptional()
  label?: string;

  @ApiPropertyOptional()
  available?: boolean;

  @ApiPropertyOptional()
  explicit_lyrics?: boolean;

  @ApiPropertyOptional({ type: () => DeezerArtistDto })
  artist?: DeezerArtistDto;

  @ApiPropertyOptional({ type: () => [DeezerContributorDto] })
  contributors?: DeezerContributorDto[];

  @ApiPropertyOptional({ type: () => DeezerGenreListDto })
  genres?: DeezerGenreListDto;

  @ApiPropertyOptional({ type: () => DeezerTrackListResponseDto })
  tracks?: DeezerTrackListResponseDto;
}

export class DeezerSearchResponseDto extends DeezerTrackListResponseDto {}
