import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DeezerSearchResponseDto } from 'src/providers/deezer/deezer.types';
import { SoundCloudSearchResponseDto } from 'src/providers/soundcloud/soundcloud.types';
import { SearchService } from 'src/search/search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({ summary: 'Search tracks in Deezer' })
  @ApiQuery({
    name: 'q',
    description: 'Search query string',
    example: 'The Weeknd',
  })
  @ApiOkResponse({
    description: 'Deezer track search results',
    type: DeezerSearchResponseDto,
  })
  @Get()
  async search(@Query('q') query: string): Promise<DeezerSearchResponseDto> {
    return this.searchService.search(query);
  }

  @ApiOperation({ summary: 'Get Deezer chart (top tracks, albums, artists)' })
  @ApiOkResponse({ description: 'Deezer chart data' })
  @Get('chart')
  async getChart() {
    return this.searchService.getChart();
  }

  @ApiOperation({ summary: 'Search tracks in SoundCloud' })
  @ApiQuery({
    name: 'q',
    description: 'Search query string',
    example: 'The Weeknd',
  })
  @ApiOkResponse({
    description: 'SoundCloud track search results',
    type: SoundCloudSearchResponseDto,
  })
  @Get('soundcloud')
  async searchSoundCloud(
    @Query('q') query: string,
  ): Promise<SoundCloudSearchResponseDto> {
    return this.searchService.searchSoundCloud(query);
  }
}
