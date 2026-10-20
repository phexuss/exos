import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
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
    summary: 'Warm the stream URL cache for a track that will play next',
  })
  @ApiAcceptedResponse({ description: 'Prefetch scheduled (best-effort)' })
  @Post('prefetch')
  @HttpCode(HttpStatus.ACCEPTED)
  prefetch(@Body() dto: DownloadDto): void {
    this.downloadService.prefetchStream(dto);
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
    summary: 'Resolve direct audio URL for query params without streaming',
  })
  @ApiOkResponse({
    description: 'Resolved direct URL to stream/download audio',
    type: DownloadResponseDto,
  })
  @Get('resolve')
  async resolve(@Query() dto: DownloadDto): Promise<DownloadResponseDto> {
    return this.downloadService.getDownloadUrl(dto);
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
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    const downloadDto = this.downloadService.resolveStreamTicket(dto.token);
    if (this.downloadService.usesCachedStream(downloadDto)) {
      await this.downloadService.streamCachedAudio(downloadDto, req, res);
      return;
    }

    await this.downloadService.streamAudio(downloadDto, res);
  }
}
