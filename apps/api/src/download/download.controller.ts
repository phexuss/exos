import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from 'src/auth/decorators/public.decorator';
import type { AuthStatusResponseDto } from 'src/auth/dto/auth.dto';
import {
  DownloadDto,
  DownloadResponseDto,
  DownloadTicketQueryDto,
  DownloadTicketResponseDto,
} from './download.dto';
import { DownloadService } from './download.service';

@ApiTags('Download')
@ApiBearerAuth()
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
    summary: 'Create short-lived ticket for server-side audio streaming',
  })
  @ApiCreatedResponse({
    description: 'Signed ticket for GET /download/stream-ticket',
    type: DownloadTicketResponseDto,
  })
  @Post('stream-ticket')
  async createStreamTicket(
    @Body() dto: DownloadDto,
    @Req() req: Request,
  ): Promise<DownloadTicketResponseDto> {
    return this.downloadService.createStreamTicket(
      dto,
      req.user as AuthStatusResponseDto,
    );
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

  @ApiOperation({
    summary: 'Stream audio bytes using a short-lived signed ticket',
  })
  @ApiOkResponse({
    description:
      'Raw audio stream (Content-Type audio/mp4 for m4a, audio/webm otherwise)',
  })
  @Public()
  @Get('stream-ticket')
  async streamWithTicket(
    @Query() dto: DownloadTicketQueryDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const downloadDto = this.downloadService.resolveStreamTicket(dto.token);
    await this.downloadService.streamAudio(downloadDto, res);
  }
}
