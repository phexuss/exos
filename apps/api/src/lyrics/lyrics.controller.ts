import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { LyricsService } from './lyrics.service';
import { LyricsResponseDto } from './lyrics.types';

@ApiTags('Lyrics')
@ApiBearerAuth()
@Controller('lyrics')
export class LyricsController {
  constructor(private readonly lyricsService: LyricsService) {}

  @ApiOperation({ summary: 'Get lyrics by artist and track' })
  @ApiQuery({ name: 'artist', description: 'Artist name', example: 'Coldplay' })
  @ApiQuery({ name: 'track', description: 'Track name', example: 'Yellow' })
  @ApiQuery({
    name: 'duration',
    required: false,
    description: 'Track duration in seconds used for better fallback match',
    example: 266,
    type: Number,
  })
  @ApiOkResponse({
    description:
      'Lyrics result. May contain only null lyric fields when no match is found.',
    type: LyricsResponseDto,
  })
  @Get()
  async getLyrics(
    @Query('artist') artist: string,
    @Query('track') track: string,
    @Query('duration') duration?: number,
  ): Promise<LyricsResponseDto> {
    return this.lyricsService.getLyrics(artist, track, duration);
  }
}
