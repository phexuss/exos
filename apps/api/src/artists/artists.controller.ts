import { Controller, Get, Param } from '@nestjs/common';
import { ArtistsService } from './artists.service';

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Get(':id')
  async getArtist(@Param('id') id: string) {
    return this.artistsService.getArtist(id);
  }

  @Get(':id/tracks')
  async getArtistTracks(@Param('id') id: string) {
    return this.artistsService.getArtistTracks(id);
  }

  @Get(':id/albums')
  async getArtistAlbums(@Param('id') id: string) {
    return this.artistsService.getArtistAlbums(id);
  }
}
