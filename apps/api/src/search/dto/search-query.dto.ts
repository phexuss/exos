import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'The Weeknd',
    minLength: 1,
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  q!: string;
}

export class SimilarTracksQueryDto {
  @ApiProperty({
    description: 'Artist name',
    example: 'Tame Impala',
    minLength: 1,
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  artist!: string;

  @ApiProperty({
    description: 'Track name',
    example: 'Let It Happen',
    minLength: 1,
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  track!: string;
}
