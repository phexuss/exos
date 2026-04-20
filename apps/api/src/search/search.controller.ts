import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from 'src/search/search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') query: string) {
    return this.searchService.search(query);
  }

  @Get('soundcloud')
  async searchSoundCloud(@Query('q') query: string) {
    return this.searchService.searchSoundCloud(query);
  }
}
