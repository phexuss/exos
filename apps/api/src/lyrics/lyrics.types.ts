import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface LRCLibResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string;
}

export class LyricsResponseDto {
  @ApiPropertyOptional()
  id?: number;

  @ApiPropertyOptional()
  trackName?: string;

  @ApiPropertyOptional()
  artistName?: string;

  @ApiPropertyOptional()
  albumName?: string;

  @ApiPropertyOptional()
  duration?: number;

  @ApiPropertyOptional()
  instrumental?: boolean;

  @ApiProperty({ nullable: true, required: false })
  plainLyrics?: string | null;

  @ApiProperty({ nullable: true, required: false })
  syncedLyrics?: string | null;
}
