import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

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
    minLength: 1,
    maxLength: 2048,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  query!: string;

  @ApiPropertyOptional({
    description: 'Optional ISRC code for precise source match',
    example: 'GBDUW1000014',
  })
  @IsString()
  @IsOptional()
  @Length(12, 12)
  @Matches(/^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/i, {
    message: 'ISRC must be a valid 12-character code',
  })
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

export class DownloadTicketResponseDto {
  @ApiProperty({
    description:
      'Short-lived signed token for downloading through stream-ticket',
    example: 'eyJxdWVyeSI6IkRhZnQgUHVuayJ9.signature',
  })
  token!: string;

  @ApiProperty({
    description: 'Unix timestamp in milliseconds when the ticket expires',
    example: 1713957300000,
  })
  expiresAt!: number;
}

export class DownloadTicketQueryDto {
  @ApiProperty({
    description: 'Short-lived signed download ticket',
    example: 'eyJxdWVyeSI6IkRhZnQgUHVuayJ9.signature',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  token!: string;
}
