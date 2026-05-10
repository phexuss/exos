import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { DeezerIdParamDto } from 'src/common/dto/deezer-id-param.dto';
import { DeezerTrackFullDto } from 'src/providers/deezer/deezer.types';
import { TracksService } from './tracks.service';

@ApiTags('Tracks')
@ApiBearerAuth()
@Controller('tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @ApiOperation({ summary: 'Get Deezer track by id' })
  @ApiParam({ name: 'id', description: 'Track id' })
  @ApiOkResponse({ description: 'Track details', type: DeezerTrackFullDto })
  @Get(':id')
  async getTrack(
    @Param() { id }: DeezerIdParamDto,
  ): Promise<DeezerTrackFullDto> {
    return this.tracksService.getTrack(id);
  }
}
