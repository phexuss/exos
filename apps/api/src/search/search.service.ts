import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { DeezerService } from 'src/providers/deezer/deezer.service';
import { LastfmService } from 'src/providers/lastfm/lastfm.service';
import {
  DeezerChartResponse,
  DeezerSearchResponse,
} from 'src/providers/deezer/deezer.types';
import { SoundCloudService } from 'src/providers/soundcloud/soundcloud.service';
import { SoundCloudSearchResponse } from 'src/providers/soundcloud/soundcloud.types';

@Injectable()
export class SearchService {
  constructor(
    private readonly deezerService: DeezerService,
    private readonly soundCloudService: SoundCloudService,
    private readonly lastfmService: LastfmService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async search(query: string): Promise<DeezerSearchResponse> {
    const cacheKey = `search:deezer:${query.toLowerCase().trim()}`;

    const cached = await this.cacheManager.get<DeezerSearchResponse>(cacheKey);
    if (cached) return cached;

    const result = await this.deezerService.searchTracks(query);
    await this.cacheManager.set(cacheKey, result);

    return result;
  }

  async getChart(): Promise<DeezerChartResponse> {
    const cacheKey = 'chart:global';

    const cached = await this.cacheManager.get<DeezerChartResponse>(cacheKey);
    if (cached) return cached;

    const result = await this.deezerService.getChart();
    await this.cacheManager.set(cacheKey, result, 3600);

    return result;
  }

  async getSimilar(artist: string, track: string) {
    const similar = await this.lastfmService.getSimilarTracks(artist, track, 5);

    const enriched = await Promise.all(
      similar.map(async (t) => {
        try {
          const deezerResult = await this.deezerService.searchTracks(
            `${t.artist.name} ${t.name}`,
          );
          const deezerTrack = deezerResult.data[0];
          if (!deezerTrack) return null;

          return {
            title: t.name,
            artist: t.artist.name,
            match: Math.round(t.match * 100),
            coverUrl: deezerTrack.album.cover_medium,
            duration: deezerTrack.duration,
            isrc: deezerTrack.isrc,
            deezerId: deezerTrack.id,
          };
        } catch {
          return null;
        }
      }),
    );

    return enriched.filter(Boolean);
  }

  async searchSoundCloud(query: string): Promise<SoundCloudSearchResponse> {
    const cacheKey = `search:sc:${query.toLowerCase().trim()}`;

    const cached =
      await this.cacheManager.get<SoundCloudSearchResponse>(cacheKey);
    if (cached) return cached;

    const result = await this.soundCloudService.searchTracks(query);
    await this.cacheManager.set(cacheKey, result);

    return result;
  }
}
