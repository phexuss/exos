import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DominantColorResponseDto } from './color.dto';
import { ColorService } from './color.service';

@ApiTags('Color')
@Controller('color')
export class ColorController {
  constructor(private readonly colorService: ColorService) {}

  @ApiOperation({ summary: 'Extract dominant accent color from image URL' })
  @ApiQuery({
    name: 'url',
    description: 'Public image URL',
    example:
      'https://e-cdns-images.dzcdn.net/images/cover/ab1234/1000x1000-000000-80-0-0.jpg',
  })
  @ApiOkResponse({
    description: 'Dominant color in HEX format',
    type: DominantColorResponseDto,
  })
  @Get()
  async getDominant(
    @Query('url') url: string,
  ): Promise<DominantColorResponseDto> {
    const hex = await this.colorService.getDominantColor(url);
    return { color: hex };
  }
}
