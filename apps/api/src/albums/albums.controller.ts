import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  DeezerAlbumDetailsDto,
  DeezerTrackListResponseDto,
} from 'src/providers/deezer/deezer.types';
import { AlbumsService } from './albums.service';

@ApiTags('Albums')
@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @ApiOperation({ summary: 'Get Deezer album by id' })
  @ApiParam({ name: 'id', description: 'Album id' })
  @ApiOkResponse({ description: 'Album details', type: DeezerAlbumDetailsDto })
  @Get(':id')
  async getAlbum(@Param('id') id: string): Promise<DeezerAlbumDetailsDto> {
    return this.albumsService.getAlbum(id);
  }

  @ApiOperation({ summary: 'Get tracks for album' })
  @ApiParam({ name: 'id', description: 'Album id' })
  @ApiOkResponse({
    description: 'Album tracks',
    type: DeezerTrackListResponseDto,
  })
  @Get(':id/tracks')
  async getAlbumTracks(
    @Param('id') id: string,
  ): Promise<DeezerTrackListResponseDto> {
    return this.albumsService.getAlbumTracks(id);
  }
}
