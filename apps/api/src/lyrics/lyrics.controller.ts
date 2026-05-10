import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { LyricsQueryDto } from './dto/lyrics-query.dto';
import { LyricsService } from './lyrics.service';
import { LyricsResponseDto } from './lyrics.types';

@ApiTags('Lyrics')
@ApiBearerAuth()
@Controller('lyrics')
export class LyricsController {
  constructor(private readonly lyricsService: LyricsService) {}

  @ApiOperation({ summary: 'Get lyrics by artist and track' })
  @ApiOkResponse({
    description:
      'Lyrics result. May contain only null lyric fields when no match is found.',
    type: LyricsResponseDto,
  })
  @Get()
  async getLyrics(@Query() query: LyricsQueryDto): Promise<LyricsResponseDto> {
    return this.lyricsService.getLyrics(
      query.artist,
      query.track,
      query.duration,
    );
  }
}
