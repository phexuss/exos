import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const LIBRARY_SOURCES = ['deezer', 'soundcloud'] as const;

export type LibrarySource = (typeof LIBRARY_SOURCES)[number];

export class LibraryTrackDto {
  @IsString()
  @IsOptional()
  @MaxLength(256)
  trackId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  deezerId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2048)
  scUrl?: string;

  @IsIn(LIBRARY_SOURCES)
  source!: LibrarySource;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  artistName!: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  artistId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  album?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2048)
  coverUrl?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  duration!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(24 * 60 * 60)
  durationSec!: number;

  @IsString()
  @IsOptional()
  @MaxLength(2048)
  previewUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2048)
  isrc?: string;

  @IsDateString()
  @IsOptional()
  addedAt?: string;

  @IsDateString()
  @IsOptional()
  playedAt?: string;
}

export class BulkLibraryTracksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LibraryTrackDto)
  @ArrayMaxSize(500)
  tracks!: LibraryTrackDto[];
}

export class LibraryQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  limit = 100;
}

export class BulkLibraryResponseDto {
  count!: number;
}
