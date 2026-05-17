import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import type { LastfmSimilarResponse, LastfmSimilarTrack } from './lastfm.types';

@Injectable()
export class LastfmService {
  private readonly BASE_URL = 'https://ws.audioscrobbler.com/2.0';
  private readonly logger = new Logger(LastfmService.name);
  private hasWarnedAboutMissingKey = false;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private get apiKey(): string | null {
    const value = this.configService.get<string>('LASTFM_API_KEY');
    return value && value.trim().length > 0 ? value.trim() : null;
  }

  async getSimilarTracks(
    artist: string,
    track: string,
    limit = 5,
  ): Promise<LastfmSimilarTrack[]> {
    const apiKey = this.apiKey;
    if (!apiKey) {
      if (!this.hasWarnedAboutMissingKey) {
        this.logger.warn(
          'LASTFM_API_KEY is not configured — returning empty similar-track results.',
        );
        this.hasWarnedAboutMissingKey = true;
      }
      return [];
    }

    const normalizedArtist = artist.trim();
    const normalizedTrack = track.trim();
    const cacheKey =
      `lastfm:similar:${normalizedArtist}:${normalizedTrack}:${limit}`.toLowerCase();

    const cached = await this.cacheManager.get<LastfmSimilarTrack[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<LastfmSimilarResponse>(this.BASE_URL, {
          params: {
            method: 'track.getSimilar',
            artist: normalizedArtist,
            track: normalizedTrack,
            api_key: apiKey,
            format: 'json',
            limit,
            autocorrect: 1,
          },
        }),
      );

      const raw = data.similartracks?.track ?? [];
      const tracks = Array.isArray(raw) ? raw : [raw];

      await this.cacheManager.set(cacheKey, tracks, 86400);
      return tracks;
    } catch (error) {
      this.logger.warn(
        `Last.fm getSimilar failed for "${normalizedArtist} — ${normalizedTrack}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return [];
    }
  }
}
