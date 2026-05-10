import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class LyricsQueryDto {
  @ApiProperty({
    description: 'Artist name',
    example: 'Coldplay',
    minLength: 1,
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  artist!: string;

  @ApiProperty({
    description: 'Track name',
    example: 'Yellow',
    minLength: 1,
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  track!: string;

  @ApiPropertyOptional({
    description: 'Track duration in seconds used for better fallback match',
    example: 266,
    minimum: 1,
    maximum: 24 * 60 * 60,
    type: Number,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24 * 60 * 60)
  duration?: number;
}
