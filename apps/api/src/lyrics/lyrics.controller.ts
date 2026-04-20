import { Controller, Get, Query } from '@nestjs/common';
import { LyricsService } from './lyrics.service';

@Controller('lyrics')
export class LyricsController {
  constructor(private readonly lyricsService: LyricsService) {}
  @Get()
  async getLyrics(
    @Query('artist') artist: string,
    @Query('track') track: string,
    @Query('duration') duration?: number,
  ) {
    return this.lyricsService.getLyrics(artist, track, duration);
  }
}
