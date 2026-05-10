import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { DeezerService } from 'src/providers/deezer/deezer.service';

@Injectable()
export class AlbumsService {
  constructor(
    private readonly deezerService: DeezerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getAlbum(id: number) {
    const cacheKey = `album:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const result = await this.deezerService.getAlbum(id);
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  async getAlbumTracks(id: number) {
    const cacheKey = `album:${id}:tracks`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const result = await this.deezerService.getAlbumTracks(id);
    await this.cacheManager.set(cacheKey, result);
    return result;
  }
}
