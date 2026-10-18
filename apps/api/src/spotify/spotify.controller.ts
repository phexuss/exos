import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from 'src/auth/decorators/public.decorator';
import { AuthStatusResponseDto } from 'src/auth/dto/auth.dto';
import {
  SpotifyConnectDto,
  SpotifyImportPageDto,
  SpotifyImportQueryDto,
  SpotifyPlaylistDto,
  SpotifyStatusDto,
} from './dto/spotify.dto';
import { SpotifyService } from './spotify.service';

@ApiTags('Spotify')
@ApiBearerAuth()
@Controller('spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  private getUserId(req: Request): string {
    const { sub } = req.user as AuthStatusResponseDto;
    return sub;
  }

  @ApiOperation({ summary: 'Whether Spotify import is set up and connected' })
  @ApiOkResponse({ type: SpotifyStatusDto })
  @Get('status')
  getStatus(@Req() req: Request): Promise<SpotifyStatusDto> {
    return this.spotifyService.getStatus(this.getUserId(req));
  }

  @ApiOperation({ summary: 'Start Spotify sign-in, returns the authorize URL' })
  @ApiCreatedResponse({ type: SpotifyConnectDto })
  @Post('connect')
  async connect(@Req() req: Request): Promise<SpotifyConnectDto> {
    const url = await this.spotifyService.createAuthorizeUrl(
      this.getUserId(req),
    );
    return { url };
  }

  @ApiExcludeEndpoint()
  @Public()
  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.spotifyService.handleCallback({
      code,
      state,
      error,
    });
    const params = new URLSearchParams(
      result.ok ? { status: 'ok' } : { status: 'error', reason: result.reason },
    );
    res.redirect(
      302,
      `${this.spotifyService.appRedirectUri}?${params.toString()}`,
    );
  }

  @ApiOperation({ summary: 'Forget the Spotify connection' })
  @Delete('connection')
  async disconnect(@Req() req: Request): Promise<{ ok: true }> {
    await this.spotifyService.disconnect(this.getUserId(req));
    return { ok: true };
  }

  @ApiOperation({ summary: 'Liked Songs plus the user playlists' })
  @ApiOkResponse({ type: SpotifyPlaylistDto, isArray: true })
  @Get('playlists')
  getPlaylists(@Req() req: Request): Promise<SpotifyPlaylistDto[]> {
    return this.spotifyService.getPlaylists(this.getUserId(req));
  }

  @ApiOperation({
    summary:
      'One page of a playlist matched to Deezer tracks (use id "liked" for Liked Songs)',
  })
  @ApiOkResponse({ type: SpotifyImportPageDto })
  @Get('playlists/:id/tracks')
  getImportPage(
    @Req() req: Request,
    @Param('id') id: string,
    @Query() query: SpotifyImportQueryDto,
  ): Promise<SpotifyImportPageDto> {
    return this.spotifyService.getImportPage(
      this.getUserId(req),
      id,
      query.offset,
    );
  }
}
