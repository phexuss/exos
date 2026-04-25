import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AudioFormat {
  MP3 = 'mp3',
  FLAC = 'flac',
  M4A = 'm4a',
}

export class DownloadDto {
  @ApiProperty({
    description: 'Search query or direct URL used to resolve stream URL',
    example: 'Daft Punk - Harder Better Faster Stronger',
  })
  @IsString()
  query!: string;

  @ApiPropertyOptional({
    description: 'Optional ISRC code for precise source match',
    example: 'GBDUW1000014',
  })
  @IsString()
  @IsOptional()
  isrc?: string;

  @ApiPropertyOptional({
    description: 'Preferred audio format',
    enum: AudioFormat,
    default: AudioFormat.MP3,
  })
  @IsEnum(AudioFormat)
  @IsOptional()
  format: AudioFormat = AudioFormat.MP3;
}

export class DownloadResponseDto {
  @ApiProperty({
    description: 'Resolved direct URL to audio stream',
    example: 'https://rr3---sn-gqn-h5ql.googlevideo.com/videoplayback?...',
  })
  url!: string;
}
