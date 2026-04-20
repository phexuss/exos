import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AudioFormat {
  MP3 = 'mp3',
  FLAC = 'flac',
  M4A = 'm4a',
}

export class DownloadDto {
  @IsString()
  query!: string;

  @IsString()
  @IsOptional()
  isrc?: string;

  @IsEnum(AudioFormat)
  @IsOptional()
  format: AudioFormat = AudioFormat.MP3;
}
