import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { DeezerService } from 'src/providers/deezer/deezer.service';

@Injectable()
export class ArtistsService {
  constructor(
    private readonly deezerService: DeezerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getArtist(id: number) {
    const cacheKey = `artist:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const result = await this.deezerService.getArtist(id);
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  async getArtistTracks(id: number) {
    const cacheKey = `artist:${id}:tracks`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const result = await this.deezerService.getArtistTracks(id);
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  async getArtistAlbums(id: number) {
    const cacheKey = `artist:${id}:albums`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const result = await this.deezerService.getArtistAlbums(id);
    await this.cacheManager.set(cacheKey, result);
    return result;
  }
}
