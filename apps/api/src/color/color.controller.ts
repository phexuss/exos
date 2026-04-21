import { Controller, Get, Query } from '@nestjs/common';
import { ColorService } from './color.service';

@Controller('color')
export class ColorController {
  constructor(private readonly colorService: ColorService) {}

  @Get()
  async getDominant(@Query('url') url: string) {
    const hex = await this.colorService.getDominantColor(url);
    return { color: hex };
  }
}
