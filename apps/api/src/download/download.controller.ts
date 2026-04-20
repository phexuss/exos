import { Body, Controller, Post } from '@nestjs/common';
import { DownloadDto } from './download.dto';
import { DownloadService } from './download.service';

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Post()
  async getDownloadUrl(@Body() dto: DownloadDto) {
    return this.downloadService.getDownloadUrl(dto);
  }
}
