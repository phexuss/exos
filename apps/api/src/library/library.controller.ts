import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthStatusResponseDto } from 'src/auth/dto/auth.dto';
import {
  BulkLibraryResponseDto,
  BulkLibraryTracksDto,
  LibraryQueryDto,
  LibraryTrackDto,
} from './dto/library.dto';
import { LibraryService } from './library.service';

@ApiTags('Library')
@ApiBearerAuth()
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  private getUserId(req: Request): string {
    const { sub } = req.user as AuthStatusResponseDto;
    return sub;
  }

  @ApiOperation({ summary: 'Get backed up downloaded track metadata' })
  @ApiOkResponse({ type: LibraryTrackDto, isArray: true })
  @Get('downloads')
  getDownloads(
    @Req() req: Request,
    @Query() query: LibraryQueryDto,
  ): Promise<LibraryTrackDto[]> {
    return this.libraryService.getDownloads(this.getUserId(req), query.limit);
  }

  @ApiOperation({ summary: 'Upsert one downloaded track metadata record' })
  @ApiCreatedResponse({ type: LibraryTrackDto })
  @Post('downloads')
  upsertDownload(
    @Req() req: Request,
    @Body() dto: LibraryTrackDto,
  ): Promise<LibraryTrackDto> {
    return this.libraryService.upsertDownload(this.getUserId(req), dto);
  }

  @ApiOperation({ summary: 'Bulk upsert downloaded track metadata records' })
  @ApiCreatedResponse({ type: BulkLibraryResponseDto })
  @Post('downloads/bulk')
  async upsertDownloadsBulk(
    @Req() req: Request,
    @Body() dto: BulkLibraryTracksDto,
  ): Promise<BulkLibraryResponseDto> {
    const count = await this.libraryService.upsertDownloadsBulk(
      this.getUserId(req),
      dto.tracks,
    );
    return { count };
  }

  @ApiOperation({ summary: 'Get synced recently played history' })
  @ApiOkResponse({ type: LibraryTrackDto, isArray: true })
  @Get('recent')
  getRecentlyPlayed(
    @Req() req: Request,
    @Query() query: LibraryQueryDto,
  ): Promise<LibraryTrackDto[]> {
    return this.libraryService.getRecentlyPlayed(
      this.getUserId(req),
      query.limit,
    );
  }

  @ApiOperation({ summary: 'Upsert one recently played history record' })
  @ApiCreatedResponse({ type: LibraryTrackDto })
  @Post('recent')
  upsertRecentlyPlayed(
    @Req() req: Request,
    @Body() dto: LibraryTrackDto,
  ): Promise<LibraryTrackDto> {
    return this.libraryService.upsertRecentlyPlayed(this.getUserId(req), dto);
  }

  @ApiOperation({ summary: 'Bulk upsert recently played history records' })
  @ApiCreatedResponse({ type: BulkLibraryResponseDto })
  @Post('recent/bulk')
  async upsertRecentlyPlayedBulk(
    @Req() req: Request,
    @Body() dto: BulkLibraryTracksDto,
  ): Promise<BulkLibraryResponseDto> {
    const count = await this.libraryService.upsertRecentlyPlayedBulk(
      this.getUserId(req),
      dto.tracks,
    );
    return { count };
  }
}
