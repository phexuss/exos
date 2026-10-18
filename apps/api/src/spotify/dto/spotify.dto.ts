import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { DeezerTrackDto } from 'src/providers/deezer/deezer.types';

/** Pseudo playlist id for the user's Liked Songs. */
export const SPOTIFY_LIKED_ID = 'liked';

export class SpotifyStatusDto {
  @ApiProperty({ description: 'Spotify credentials are set on the server' })
  configured!: boolean;

  @ApiProperty()
  connected!: boolean;

  @ApiPropertyOptional({ nullable: true })
  displayName!: string | null;
}

export class SpotifyConnectDto {
  @ApiProperty({ description: 'Spotify authorize URL to open in a browser' })
  url!: string;
}

export class SpotifyPlaylistDto {
  @ApiProperty({ example: SPOTIFY_LIKED_ID })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  coverUrl!: string | null;

  @ApiProperty()
  total!: number;

  @ApiProperty({
    description:
      'Spotify only returns tracks of playlists the user owns or collaborates on',
  })
  readable!: boolean;
}

export class SpotifyUnmatchedTrackDto {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  artist!: string;
}

export class SpotifyImportPageDto {
  @ApiProperty({ description: 'Total entries in the Spotify playlist' })
  total!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Offset for the next page, null when done',
  })
  nextOffset!: number | null;

  @ApiProperty({ type: DeezerTrackDto, isArray: true })
  tracks!: DeezerTrackDto[];

  @ApiProperty({ type: SpotifyUnmatchedTrackDto, isArray: true })
  unmatched!: SpotifyUnmatchedTrackDto[];
}

export class SpotifyImportQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000)
  @IsOptional()
  offset = 0;
}
