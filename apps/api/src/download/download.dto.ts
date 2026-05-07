import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AudioFormat {
  MP3 = 'mp3',
  FLAC = 'flac',
  M4A = 'm4a',
  WEBM = 'webm',
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
    default: AudioFormat.M4A,
  })
  @IsEnum(AudioFormat)
  @IsOptional()
  format: AudioFormat = AudioFormat.M4A;
}

export class DownloadResponseDto {
  @ApiProperty({
    description: 'Resolved direct URL to audio stream',
    example: 'https://rr3---sn-gqn-h5ql.googlevideo.com/videoplayback?...',
  })
  url!: string;
}
