import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
}
