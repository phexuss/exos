import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { DeezerService } from 'src/providers/deezer/deezer.service';
import { SoundCloudService } from 'src/providers/soundcloud/soundcloud.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly deezerService: DeezerService,
    private readonly soundCloudService: SoundCloudService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async search(query: string) {
    const cacheKey = `search:deezer:${query.toLowerCase().trim()}`;

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const result = await this.deezerService.searchTracks(query);
    await this.cacheManager.set(cacheKey, result);

    return result;
  }

  async searchSoundCloud(query: string) {
    const cacheKey = `search:sc:${query.toLowerCase().trim()}`;

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const result = await this.soundCloudService.searchTracks(query);
    await this.cacheManager.set(cacheKey, result);

    return result;
  }
}
