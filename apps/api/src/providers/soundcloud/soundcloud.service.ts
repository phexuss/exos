import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import youtubedl from 'youtube-dl-exec';
import type {
  SoundCloudSearchResponse,
  SoundCloudSearchResult,
  SoundCloudTrackInfo,
} from './soundcloud.types';

const ytdlp = youtubedl.create('/usr/bin/yt-dlp');

@Injectable()
export class SoundCloudService {
  private readonly logger = new Logger(SoundCloudService.name);

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

      const result = await ytdlp(source, {
        dumpSingleJson: true,
        flatPlaylist: true,
        noWarnings: true,
      });

      const raw = result as any;
      const entries: any[] = raw.entries ?? [];

      const data: SoundCloudSearchResult[] = entries.map((e) => ({
        id: String(e.id ?? e.url ?? ''),
        title: e.title ?? '',
        uploader: e.uploader ?? e.channel ?? '',
        uploader_id: e.uploader_id ?? '',
        uploader_url: e.uploader_url ?? '',
        duration: Math.round(e.duration ?? 0),
        webpage_url: e.webpage_url ?? e.url ?? '',
        view_count: e.view_count ?? undefined,
        like_count: e.like_count ?? undefined,
        thumbnails: (e.thumbnails ?? []).map((t: any) => ({
          id: t.id ?? '',
          url: t.url ?? '',
          width: t.width,
          height: t.height,
          resolution: t.resolution,
        })),
      }));

      return { data, total: data.length };
    } catch (e: unknown) {
      this.logger.error('SC search error:', e);
      const message =
        e instanceof Error ? e.message : JSON.stringify(e);
      throw new BadRequestException(`SoundCloud search failed: ${message}`);
    }
  }

  /**
   * Get full track metadata via yt-dlp -J.
   */
  async getTrackInfo(url: string): Promise<SoundCloudTrackInfo> {
    try {
      this.logger.debug(`SC track info: ${url}`);

      const result = await ytdlp(url, {
        dumpSingleJson: true,
        noWarnings: true,
        skipDownload: true,
      });

      const e = result as any;

      return {
        id: String(e.id ?? ''),
        title: e.title ?? '',
        uploader: e.uploader ?? '',
        uploader_id: e.uploader_id ?? '',
        uploader_url: e.uploader_url ?? '',
        duration: Math.round(e.duration ?? 0),
        webpage_url: e.webpage_url ?? '',
        description: e.description ?? undefined,
        view_count: e.view_count ?? undefined,
        like_count: e.like_count ?? undefined,
        repost_count: e.repost_count ?? undefined,
        genres: e.genres ?? [],
        tags: e.tags ?? [],
        artists: e.artists ?? [],
        thumbnails: (e.thumbnails ?? []).map((t: any) => ({
          id: t.id ?? '',
          url: t.url ?? '',
          width: t.width,
          height: t.height,
          resolution: t.resolution,
        })),
        formats: (e.formats ?? []).map((f: any) => ({
          url: f.url ?? '',
          format_id: f.format_id ?? '',
          protocol: f.protocol ?? '',
          ext: f.ext ?? '',
          acodec: f.acodec ?? undefined,
          abr: f.abr ?? undefined,
        })),
      };
    } catch (e: unknown) {
      this.logger.error('SC track info error:', e);
      const message =
        e instanceof Error ? e.message : JSON.stringify(e);
      throw new BadRequestException(`SoundCloud track info failed: ${message}`);
    }
  }

  /**
   * Get direct audio stream URL for a SoundCloud track.
   */
  async getStreamUrl(url: string): Promise<{ url: string }> {
    try {
      this.logger.debug(`SC stream URL: ${url}`);

      const result = (await ytdlp(url, {
        getUrl: true,
        format: 'bestaudio[ext=mp3]/bestaudio[ext=m4a]/bestaudio',
        noPlaylist: true,
      })) as unknown as string;

      this.logger.debug(
        `SC stream URL resolved (${result.trim().length} chars)`,
      );
      return { url: result.trim() };
    } catch (e: unknown) {
      this.logger.error('SC stream URL error:', e);
      const message =
        e instanceof Error ? e.message : JSON.stringify(e);
      throw new BadRequestException(
        `SoundCloud stream URL failed: ${message}`,
      );
    }
  }
}
