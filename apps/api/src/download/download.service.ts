import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DownloadDto } from 'src/download/download.dto';
import youtubedl from 'youtube-dl-exec';

const ytdlp = youtubedl.create('/usr/bin/yt-dlp');

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);

  async getDownloadUrl(dto: DownloadDto) {
    try {
      let source: string;

      if (dto.query.startsWith('http')) {
        source = dto.query;
      } else if (dto.isrc) {
        source = `ytsearch1:${dto.isrc}`;
      } else {
        source = `ytsearch1:${dto.query}`;
      }

      this.logger.debug(`Resolving source: ${source}`);

      const format =
        dto.format === 'flac'
          ? 'bestaudio[ext=flac]/bestaudio'
          : dto.format === 'm4a'
            ? 'bestaudio[ext=m4a]/bestaudio'
            : 'bestaudio[ext=mp3]/bestaudio[ext=m4a]/bestaudio';

      const result = (await ytdlp(source, {
        getUrl: true,
        format,
        noPlaylist: true,
      })) as unknown as string;

      this.logger.debug(`Result URL resolved (${result.trim().length} chars)`);
      return { url: result.trim() };
    } catch (e: unknown) {
      this.logger.error('youtube-dl-exec error:', e);
      const message =
        e instanceof Error
          ? e.message
          : typeof e === 'string'
            ? e
            : JSON.stringify(e);
      throw new BadRequestException(`Something went wrong: ${message}`);
    }
  }
}
