import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { DeezerService } from 'src/providers/deezer/deezer.service';
import { DeezerTrackFull } from 'src/providers/deezer/deezer.types';

@Injectable()
export class TracksService {
  constructor(
    private readonly deezerService: DeezerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getTrack(id: string): Promise<DeezerTrackFull> {
    const cacheKey = `track:${id}`;

    const cached = await this.cacheManager.get<DeezerTrackFull>(cacheKey);
    if (cached) return cached;

    const track = await this.deezerService.getTrack(id);
    await this.cacheManager.set(cacheKey, track);

    return track;
  }
}
