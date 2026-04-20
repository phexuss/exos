import { Controller, Get, Param } from '@nestjs/common';
import { AlbumsService } from './albums.service';

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Get(':id')
  async getAlbum(@Param('id') id: string) {
    return this.albumsService.getAlbum(id);
  }

  @Get(':id/tracks')
  async getAlbumTracks(@Param('id') id: string) {
    return this.albumsService.getAlbumTracks(id);
  }
}
