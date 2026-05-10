import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import youtubedl from 'youtube-dl-exec';
import type {
  SoundCloudFormat,
  SoundCloudSearchResponse,
  SoundCloudSearchResult,
  SoundCloudThumbnail,
  SoundCloudTrackInfo,
} from './soundcloud.types';

const YTDLP_BIN = '/usr/bin/yt-dlp';

type YtdlpThumbnail = Partial<SoundCloudThumbnail>;
type YtdlpFormat = Partial<SoundCloudFormat>;
type YtdlpSoundCloudEntry = {
  id?: string | number;
  url?: string;
  title?: string;
  uploader?: string;
  channel?: string;
  uploader_id?: string;
  uploader_url?: string;
  duration?: number;
  webpage_url?: string;
  description?: string;
  view_count?: number;
  like_count?: number;
  repost_count?: number;
  genres?: string[];
  tags?: string[];
  artists?: string[];
  thumbnails?: YtdlpThumbnail[];
  formats?: YtdlpFormat[];
};

type YtdlpSearchPayload = {
  entries?: YtdlpSoundCloudEntry[];
};

@Injectable()
export class SoundCloudService {
  private readonly logger = new Logger(SoundCloudService.name);

  constructor(private readonly configService: ConfigService) {}

  private get ytdlpPath(): string {
    return this.configService.get<string>('YTDLP_PATH')?.trim() || YTDLP_BIN;
  }

  private get ytdlpTimeoutMs(): number {
    return Math.max(
      1000,
      this.configService.get<number>('YTDLP_TIMEOUT_MS') ?? 10000,
    );
  }

  private get ytdlp() {
    return youtubedl.create(this.ytdlpPath);
  }

  private optionalNumber(value: number | undefined): number | undefined {
    return Number.isFinite(value) ? value : undefined;
  }

  private mapThumbnails(
    thumbnails: YtdlpThumbnail[] | undefined,
  ): SoundCloudThumbnail[] {
    return (thumbnails ?? []).map((thumbnail) => ({
      id: String(thumbnail.id ?? ''),
      url: thumbnail.url ?? '',
      width: this.optionalNumber(thumbnail.width),
      height: this.optionalNumber(thumbnail.height),
      resolution: thumbnail.resolution,
    }));
  }

  /**
   * Search SoundCloud tracks via yt-dlp `scsearch`.
   * Returns up to `limit` results with metadata.
   */
  async searchTracks(
    query: string,
    limit = 20,
  ): Promise<SoundCloudSearchResponse> {
    try {
      const source = `scsearch${limit}:${query}`;
      this.logger.debug(`SC search: ${source}`);

      const result = await this.ytdlp(
        source,
        {
          dumpSingleJson: true,
          flatPlaylist: true,
          noWarnings: true,
        },
        { timeout: this.ytdlpTimeoutMs, killSignal: 'SIGKILL' },
      );

      const raw = result as YtdlpSearchPayload;
      const entries = raw.entries ?? [];

      const data: SoundCloudSearchResult[] = entries.map((e) => ({
        id: String(e.id ?? e.url ?? ''),
        title: e.title ?? '',
        uploader: e.uploader ?? e.channel ?? '',
        uploader_id: e.uploader_id ?? '',
        uploader_url: e.uploader_url ?? '',
        duration: Math.round(e.duration ?? 0),
        webpage_url: e.webpage_url ?? e.url ?? '',
        view_count: this.optionalNumber(e.view_count),
        like_count: this.optionalNumber(e.like_count),
        thumbnails: this.mapThumbnails(e.thumbnails),
      }));

      return { data, total: data.length };
    } catch (e: unknown) {
      this.logger.error('SC search error:', e);
      const message = e instanceof Error ? e.message : JSON.stringify(e);
      throw new BadRequestException(`SoundCloud search failed: ${message}`);
    }
  }

  /**
   * Get full track metadata via yt-dlp -J.
   */
  async getTrackInfo(url: string): Promise<SoundCloudTrackInfo> {
    try {
      this.logger.debug(`SC track info: ${url}`);

      const result = await this.ytdlp(
        url,
        {
          dumpSingleJson: true,
          noWarnings: true,
          skipDownload: true,
        },
        { timeout: this.ytdlpTimeoutMs, killSignal: 'SIGKILL' },
      );

      const e = result as YtdlpSoundCloudEntry;

      return {
        id: String(e.id ?? ''),
        title: e.title ?? '',
        uploader: e.uploader ?? '',
        uploader_id: e.uploader_id ?? '',
        uploader_url: e.uploader_url ?? '',
        duration: Math.round(e.duration ?? 0),
        webpage_url: e.webpage_url ?? '',
        description: e.description ?? undefined,
        view_count: this.optionalNumber(e.view_count),
        like_count: this.optionalNumber(e.like_count),
        repost_count: this.optionalNumber(e.repost_count),
        genres: e.genres ?? [],
        tags: e.tags ?? [],
        artists: e.artists ?? [],
        thumbnails: this.mapThumbnails(e.thumbnails),
        formats: (e.formats ?? []).map((f) => ({
          url: f.url ?? '',
          format_id: f.format_id ?? '',
          protocol: f.protocol ?? '',
          ext: f.ext ?? '',
          acodec: f.acodec ?? undefined,
          abr: this.optionalNumber(f.abr),
        })),
      };
    } catch (e: unknown) {
      this.logger.error('SC track info error:', e);
      const message = e instanceof Error ? e.message : JSON.stringify(e);
      throw new BadRequestException(`SoundCloud track info failed: ${message}`);
    }
  }

  /**
   * Get direct audio stream URL for a SoundCloud track.
   */
  async getStreamUrl(url: string): Promise<{ url: string }> {
    try {
      this.logger.debug(`SC stream URL: ${url}`);

      const result = (await this.ytdlp(
        url,
        {
          getUrl: true,
          format: 'bestaudio[ext=mp3]/bestaudio[ext=m4a]/bestaudio',
          noPlaylist: true,
        },
        { timeout: this.ytdlpTimeoutMs, killSignal: 'SIGKILL' },
      )) as unknown as string;

      this.logger.debug(
        `SC stream URL resolved (${result.trim().length} chars)`,
      );
      return { url: result.trim() };
    } catch (e: unknown) {
      this.logger.error('SC stream URL error:', e);
      const message = e instanceof Error ? e.message : JSON.stringify(e);
      throw new BadRequestException(`SoundCloud stream URL failed: ${message}`);
    }
  }
}
