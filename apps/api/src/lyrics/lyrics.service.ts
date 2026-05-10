import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { LRCLibResponse } from 'src/lyrics/lyrics.types';

@Injectable()
export class LyricsService {
  private readonly BASE_URL = 'https://lrclib.net/api';
  private readonly logger = new Logger(LyricsService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getLyrics(artist: string, track: string, duration?: number) {
    const normalizedArtist = artist.trim().replace(/\s+/g, ' ');
    const normalizedTrack = track.trim().replace(/\s+/g, ' ');
    const cacheKey =
      `lyrics:${normalizedArtist}:${normalizedTrack}:${duration ?? 'none'}`.toLowerCase();
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // 1. Try exact match
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<LRCLibResponse>(`${this.BASE_URL}/get`, {
          params: {
            artist_name: normalizedArtist,
            track_name: normalizedTrack,
            ...(duration && { duration }),
          },
        }),
      );
      await this.cacheManager.set(cacheKey, data);
      return data;
    } catch (e: unknown) {
      const status =
        (e as { response?: { status?: number } })?.response?.status ?? 0;
      if (status !== 404) {
        this.logger.warn(
          `Lyrics /get error (${status}):`,
          (e as Error).message,
        );
      }
    }

    // 2. Fallback to fuzzy search
    try {
      const { data: results } = await firstValueFrom(
        this.httpService.get<LRCLibResponse[]>(`${this.BASE_URL}/search`, {
          params: {
            artist_name: normalizedArtist,
            track_name: normalizedTrack,
          },
        }),
      );

      if (results && results.length > 0) {
        const best = duration
          ? results.reduce((prev, cur) =>
              Math.abs(cur.duration - duration) <
              Math.abs(prev.duration - duration)
                ? cur
                : prev,
            )
          : results[0];
        this.logger.debug(
          `Lyrics via /search for "${normalizedArtist} - ${normalizedTrack}"`,
        );
        await this.cacheManager.set(cacheKey, best);
        return best;
      }
    } catch (e: unknown) {
      this.logger.warn(`Lyrics /search error:`, (e as Error).message);
    }

    this.logger.debug(
      `No lyrics found for "${normalizedArtist} - ${normalizedTrack}"`,
    );
    const empty = { syncedLyrics: null, plainLyrics: null };
    await this.cacheManager.set(cacheKey, empty);
    return empty;
  }
}
