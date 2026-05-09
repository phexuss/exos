import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { DownloadDto, DownloadResponseDto } from './download.dto';
import { DownloadService } from './download.service';

@ApiTags('Download')
@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @ApiOperation({
    summary: 'Resolve direct audio URL for query or source link',
  })
  @ApiCreatedResponse({
    description: 'Resolved direct URL to stream/download audio',
    type: DownloadResponseDto,
  })
  @Post()
  async getDownloadUrl(@Body() dto: DownloadDto): Promise<DownloadResponseDto> {
    return this.downloadService.getDownloadUrl(dto);
  }

  @ApiOperation({
    summary: 'Stream audio bytes directly through the server',
  })
  @ApiOkResponse({
    description:
      'Raw audio stream (Content-Type audio/mp4 for m4a, audio/webm otherwise)',
  })

  @Get('stream')
  async stream(
    @Query() dto: DownloadDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    await this.downloadService.streamAudio(dto, res);
  }
}
