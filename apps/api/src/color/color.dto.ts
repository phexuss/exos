import { ApiProperty } from '@nestjs/swagger';

export class DominantColorResponseDto {
  @ApiProperty({
    description: 'Dominant hex color extracted from image URL',
    example: '#ff6a00',
  })
  color!: string;
}
