import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import type { LastfmSimilarResponse, LastfmSimilarTrack } from './lastfm.types';

@Injectable()
export class LastfmService {
  private readonly BASE_URL = 'https://ws.audioscrobbler.com/2.0';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private get apiKey(): string {
    return this.configService.getOrThrow<string>('LASTFM_API_KEY');
  }

  async getSimilarTracks(
    artist: string,
    track: string,
    limit = 5,
  ): Promise<LastfmSimilarTrack[]> {
    const normalizedArtist = artist.trim();
    const normalizedTrack = track.trim();
    const cacheKey =
      `lastfm:similar:${normalizedArtist}:${normalizedTrack}:${limit}`.toLowerCase();

    const cached = await this.cacheManager.get<LastfmSimilarTrack[]>(cacheKey);
    if (cached) return cached;

    const { data } = await firstValueFrom(
      this.httpService.get<LastfmSimilarResponse>(this.BASE_URL, {
        params: {
          method: 'track.getSimilar',
          artist: normalizedArtist,
          track: normalizedTrack,
          api_key: this.apiKey,
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
  }
}
