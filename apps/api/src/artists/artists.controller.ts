import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  DeezerAlbumListResponseDto,
  DeezerArtistDetailsDto,
  DeezerTrackListResponseDto,
} from 'src/providers/deezer/deezer.types';
import { ArtistsService } from './artists.service';

@ApiTags('Artists')
@ApiBearerAuth()
@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @ApiOperation({ summary: 'Get Deezer artist by id' })
  @ApiParam({ name: 'id', description: 'Artist id' })
  @ApiOkResponse({
    description: 'Artist details',
    type: DeezerArtistDetailsDto,
  })
  @Get(':id')
  async getArtist(@Param('id') id: string): Promise<DeezerArtistDetailsDto> {
    return this.artistsService.getArtist(id);
  }

  @ApiOperation({ summary: 'Get top tracks for artist' })
  @ApiParam({ name: 'id', description: 'Artist id' })
  @ApiOkResponse({
    description: 'Artist tracks response',
    type: DeezerTrackListResponseDto,
  })
  @Get(':id/tracks')
  async getArtistTracks(
    @Param('id') id: string,
  ): Promise<DeezerTrackListResponseDto> {
    return this.artistsService.getArtistTracks(id);
  }

  @ApiOperation({ summary: 'Get albums for artist' })
  @ApiParam({ name: 'id', description: 'Artist id' })
  @ApiOkResponse({
    description: 'Artist albums response',
    type: DeezerAlbumListResponseDto,
  })
  @Get(':id/albums')
  async getArtistAlbums(
    @Param('id') id: string,
  ): Promise<DeezerAlbumListResponseDto> {
    return this.artistsService.getArtistAlbums(id);
  }
}
