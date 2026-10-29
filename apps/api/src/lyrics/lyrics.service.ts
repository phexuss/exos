import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { CACHE_TTL_MS } from 'src/common/cache-ttl';
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
      // An exact match without any text (often marked instrumental) is not an
      // answer: another entry of the same song may have the lyrics.
      if (data?.syncedLyrics || data?.plainLyrics) {
        await this.cacheManager.set(cacheKey, data, CACHE_TTL_MS.lyrics);
        return data;
      }
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

    try {
      const { data: results } = await firstValueFrom(
        this.httpService.get<LRCLibResponse[]>(`${this.BASE_URL}/search`, {
          params: {
            artist_name: normalizedArtist,
            track_name: normalizedTrack,
          },
        }),
      );

      const withText = (results ?? []).filter(
        (r) => r.syncedLyrics || r.plainLyrics,
      );
      if (withText.length > 0) {
        // Synced before plain; among those, the closest in length. Entries more
        // than 15 s off are usually another version of the song.
        const off = (r: LRCLibResponse) =>
          duration ? Math.abs(r.duration - duration) : 0;
        const near = withText.filter((r) => off(r) <= 15);
        const pool = near.length ? near : withText;
        const best = pool.sort(
          (a, b) =>
            Number(!a.syncedLyrics) - Number(!b.syncedLyrics) ||
            off(a) - off(b),
        )[0];
        this.logger.debug(
          `Lyrics via /search for "${normalizedArtist} - ${normalizedTrack}"`,
        );
        await this.cacheManager.set(cacheKey, best, CACHE_TTL_MS.lyrics);
        return best;
      }
    } catch (e: unknown) {
      this.logger.warn(`Lyrics /search error:`, (e as Error).message);
    }

    this.logger.debug(
      `No lyrics found for "${normalizedArtist} - ${normalizedTrack}"`,
    );
    const empty = { syncedLyrics: null, plainLyrics: null };
    await this.cacheManager.set(cacheKey, empty, CACHE_TTL_MS.lyricsMissing);
    return empty;
  }
}
