import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LibraryTrackDto } from './dto/library.dto';

type LibraryTrackRecord = {
  trackId: string | null;
  deezerId: string | null;
  scUrl: string | null;
  source: string;
  title: string;
  artistName: string;
  artistId: string | null;
  album: string | null;
  coverUrl: string | null;
  duration: string;
  durationSec: number;
  previewUrl: string | null;
  isrc: string | null;
};

type DownloadRecord = LibraryTrackRecord & {
  addedAt: Date;
};

type RecentlyPlayedRecord = LibraryTrackRecord & {
  playedAt: Date;
};

type SyncSource = LibraryTrackDto['source'];

@Injectable()
export class LibraryService {
  constructor(private readonly prismaService: PrismaService) {}

  private clean(value?: string): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private parseDate(value: string | undefined): Date {
    return value ? new Date(value) : new Date();
  }

  private latestDate(a: Date, b: Date): Date {
    return a.getTime() >= b.getTime() ? a : b;
  }

  private sourceFor(record: LibraryTrackRecord): SyncSource {
    if (record.source === 'deezer' || record.source === 'soundcloud') {
      return record.source;
    }
    return record.deezerId ? 'deezer' : 'soundcloud';
  }

  private trackIdFor(record: LibraryTrackRecord): string | undefined {
    return (
      record.trackId ??
      record.deezerId ??
      (record.scUrl ? `sc_${record.scUrl}` : undefined)
    );
  }

  private identifiers(dto: LibraryTrackDto): {
    deezerId: string | null;
    scUrl: string | null;
    trackId: string | null;
  } {
    const deezerId = this.clean(dto.deezerId);
    const scUrl = this.clean(dto.scUrl);

    if (dto.source === 'deezer' && !deezerId) {
      throw new BadRequestException('Deezer tracks require deezerId');
    }

    if (dto.source === 'soundcloud' && !scUrl) {
      throw new BadRequestException('SoundCloud tracks require scUrl');
    }

    return {
      deezerId,
      scUrl,
      trackId: this.clean(dto.trackId) ?? deezerId ?? scUrl,
    };
  }

  private baseData(dto: LibraryTrackDto) {
    const { deezerId, scUrl, trackId } = this.identifiers(dto);

    return {
      trackId,
      deezerId,
      scUrl,
      source: dto.source,
      title: dto.title.trim(),
      artistName: dto.artistName.trim(),
      artistId: this.clean(dto.artistId),
      album: this.clean(dto.album),
      coverUrl: this.clean(dto.coverUrl),
      duration: dto.duration.trim(),
      durationSec: dto.durationSec,
      previewUrl: this.clean(dto.previewUrl),
      isrc: this.clean(dto.isrc),
    };
  }

  private toDownloadDto(record: DownloadRecord): LibraryTrackDto {
    return {
      trackId: this.trackIdFor(record),
      deezerId: record.deezerId ?? undefined,
      scUrl: record.scUrl ?? undefined,
      source: this.sourceFor(record),
      title: record.title,
      artistName: record.artistName,
      artistId: record.artistId ?? undefined,
      album: record.album ?? undefined,
      coverUrl: record.coverUrl ?? undefined,
      duration: record.duration,
      durationSec: record.durationSec,
      previewUrl: record.previewUrl ?? undefined,
      isrc: record.isrc ?? undefined,
      addedAt: record.addedAt.toISOString(),
    };
  }

  private toRecentDto(record: RecentlyPlayedRecord): LibraryTrackDto {
    return {
      trackId: this.trackIdFor(record),
      deezerId: record.deezerId ?? undefined,
      scUrl: record.scUrl ?? undefined,
      source: this.sourceFor(record),
      title: record.title,
      artistName: record.artistName,
      artistId: record.artistId ?? undefined,
      album: record.album ?? undefined,
      coverUrl: record.coverUrl ?? undefined,
      duration: record.duration,
      durationSec: record.durationSec,
      previewUrl: record.previewUrl ?? undefined,
      isrc: record.isrc ?? undefined,
      playedAt: record.playedAt.toISOString(),
    };
  }

  async getDownloads(
    userId: string,
    limit: number,
  ): Promise<LibraryTrackDto[]> {
    const records = await this.prismaService.userLibrary.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
      take: limit,
    });

    return records.map((record) => this.toDownloadDto(record));
  }

  async upsertDownload(
    userId: string,
    dto: LibraryTrackDto,
  ): Promise<LibraryTrackDto> {
    const data = {
      ...this.baseData(dto),
      addedAt: this.parseDate(dto.addedAt),
    };

    if (data.deezerId) {
      const where = { userId_deezerId: { userId, deezerId: data.deezerId } };
      const existing = await this.prismaService.userLibrary.findUnique({
        where,
      });
      const record = existing
        ? await this.prismaService.userLibrary.update({
            where,
            data: {
              ...data,
              addedAt: this.latestDate(existing.addedAt, data.addedAt),
            },
          })
        : await this.prismaService.userLibrary.create({
            data: { userId, ...data },
          });

      return this.toDownloadDto(record);
    }

    const where = { userId_scUrl: { userId, scUrl: data.scUrl as string } };
    const existing = await this.prismaService.userLibrary.findUnique({ where });
    const record = existing
      ? await this.prismaService.userLibrary.update({
          where,
          data: {
            ...data,
            addedAt: this.latestDate(existing.addedAt, data.addedAt),
          },
        })
      : await this.prismaService.userLibrary.create({
          data: { userId, ...data },
        });

    return this.toDownloadDto(record);
  }

  async upsertDownloadsBulk(
    userId: string,
    tracks: LibraryTrackDto[],
  ): Promise<number> {
    await Promise.all(
      tracks.map((track) => this.upsertDownload(userId, track)),
    );
    return tracks.length;
  }

  async getRecentlyPlayed(
    userId: string,
    limit: number,
  ): Promise<LibraryTrackDto[]> {
    const records = await this.prismaService.userRecentlyPlayed.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      take: limit,
    });

    return records.map((record) => this.toRecentDto(record));
  }

  async upsertRecentlyPlayed(
    userId: string,
    dto: LibraryTrackDto,
  ): Promise<LibraryTrackDto> {
    const data = {
      ...this.baseData(dto),
      playedAt: this.parseDate(dto.playedAt),
    };

    if (data.deezerId) {
      const where = { userId_deezerId: { userId, deezerId: data.deezerId } };
      const existing = await this.prismaService.userRecentlyPlayed.findUnique({
        where,
      });
      const record = existing
        ? await this.prismaService.userRecentlyPlayed.update({
            where,
            data: {
              ...data,
              playedAt: this.latestDate(existing.playedAt, data.playedAt),
            },
          })
        : await this.prismaService.userRecentlyPlayed.create({
            data: { userId, ...data },
          });

      return this.toRecentDto(record);
    }

    const where = { userId_scUrl: { userId, scUrl: data.scUrl as string } };
    const existing = await this.prismaService.userRecentlyPlayed.findUnique({
      where,
    });
    const record = existing
      ? await this.prismaService.userRecentlyPlayed.update({
          where,
          data: {
            ...data,
            playedAt: this.latestDate(existing.playedAt, data.playedAt),
          },
        })
      : await this.prismaService.userRecentlyPlayed.create({
          data: { userId, ...data },
        });

    return this.toRecentDto(record);
  }

  async upsertRecentlyPlayedBulk(
    userId: string,
    tracks: LibraryTrackDto[],
  ): Promise<number> {
    await Promise.all(
      tracks.map((track) => this.upsertRecentlyPlayed(userId, track)),
    );
    return tracks.length;
  }
}
