import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { DeezerService } from 'src/providers/deezer/deezer.service';
import {
  DeezerChartResponse,
  DeezerSearchResponse,
  DeezerTrack,
} from 'src/providers/deezer/deezer.types';
import { LastfmService } from 'src/providers/lastfm/lastfm.service';
import { SoundCloudService } from 'src/providers/soundcloud/soundcloud.service';
import { SoundCloudSearchResponse } from 'src/providers/soundcloud/soundcloud.types';

const LASTFM_SIMILAR_CANDIDATE_LIMIT = 12;
const MAX_SIMILAR_RESULTS = 10;

type SimilarTrackResult = {
  title: string;
  artist: string;
  match: number;
  coverUrl: string | null;
  duration: number | null;
  isrc: string | null;
  deezerId: number;
};

@Injectable()
export class SearchService {
  constructor(
    private readonly deezerService: DeezerService,
    private readonly soundCloudService: SoundCloudService,
    private readonly lastfmService: LastfmService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private normalizeInput(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  private normalizeComparable(value: string): string {
    return this.stripVersionTags(value)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/\bft\.?\b/g, ' featuring ')
      .replace(/\bfeat\.?\b/g, ' featuring ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private stripVersionTags(value: string): string {
    return value
      .replace(
        /\s*[[(][^\])]*(remaster|radio edit|edit|live|mono|stereo|version|mix|acoustic|instrumental|sped up|slowed|demo)[^\])]*[\])]/gi,
        '',
      )
      .replace(
        /\s*-\s*(remaster(ed)?|radio edit|edit|live|mono|stereo|version|mix|acoustic|instrumental|sped up|slowed|demo).*$/i,
        '',
      );
  }

  private isCloseTextMatch(left: string, right: string): boolean {
    const a = this.normalizeComparable(left);
    const b = this.normalizeComparable(right);

    if (!a || !b) return false;
    if (a === b) return true;

    return a.length >= 5 && b.length >= 5 && (a.includes(b) || b.includes(a));
  }

  private isLikelyDeezerMatch(
    deezerTrack: DeezerTrack,
    artist: string,
    title: string,
  ): boolean {
    const titleMatches =
      this.isCloseTextMatch(deezerTrack.title, title) ||
      this.isCloseTextMatch(deezerTrack.title_short, title);
    const artistMatches = this.isCloseTextMatch(
      deezerTrack.artist.name,
      artist,
    );

    return titleMatches && artistMatches;
  }

  private buildDeezerQueries(artist: string, title: string): string[] {
    const safeArtist = artist.replace(/"/g, ' ');
    const safeTitle = title.replace(/"/g, ' ');
    return [
      `artist:"${safeArtist}" track:"${safeTitle}"`,
      `${artist} ${title}`,
    ];
  }

  private async findDeezerTrack(
    artist: string,
    title: string,
  ): Promise<DeezerTrack | null> {
    const queries = this.buildDeezerQueries(artist, title);
    const seenQueries = new Set<string>();

    for (const query of queries) {
      const normalizedQuery = query.toLowerCase();
      if (seenQueries.has(normalizedQuery)) continue;
      seenQueries.add(normalizedQuery);

      const deezerResult = await this.deezerService.searchTracks(query);
      const deezerTrack = deezerResult.data.find((track) =>
        this.isLikelyDeezerMatch(track, artist, title),
      );
      if (deezerTrack) return deezerTrack;
    }

    return null;
  }

  private toMatchPercent(match: number | string): number {
    const value = typeof match === 'number' ? match : Number.parseFloat(match);
    if (!Number.isFinite(value)) return 0;
    return Math.round(Math.max(0, Math.min(value, 1)) * 100);
  }

  async search(query: string): Promise<DeezerSearchResponse> {
    const normalizedQuery = this.normalizeInput(query);
    if (!normalizedQuery) {
      throw new BadRequestException('Search query is required');
    }

    const cacheKey = `search:deezer:${normalizedQuery.toLowerCase()}`;

    const cached = await this.cacheManager.get<DeezerSearchResponse>(cacheKey);
    if (cached) return cached;

    const result = await this.deezerService.searchTracks(normalizedQuery);
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

  async getSimilar(
    artist: string,
    track: string,
  ): Promise<SimilarTrackResult[]> {
    const normalizedArtist = this.normalizeInput(artist);
    const normalizedTrack = this.normalizeInput(track);

    if (!normalizedArtist || !normalizedTrack) {
      throw new BadRequestException('Artist and track are required');
    }

    const cacheKey =
      `similar:enriched:${normalizedArtist}:${normalizedTrack}`.toLowerCase();
    const cached = await this.cacheManager.get<SimilarTrackResult[]>(cacheKey);
    if (cached) return cached;

    const similar = await this.lastfmService.getSimilarTracks(
      normalizedArtist,
      normalizedTrack,
      LASTFM_SIMILAR_CANDIDATE_LIMIT,
    );

    const enriched = await Promise.all(
      similar.map(async (t): Promise<SimilarTrackResult | null> => {
        try {
          const deezerTrack = await this.findDeezerTrack(t.artist.name, t.name);
          if (!deezerTrack) return null;

          return {
            title: t.name,
            artist: t.artist.name,
            match: this.toMatchPercent(t.match),
            coverUrl: deezerTrack.album.cover_medium || null,
            duration: deezerTrack.duration ?? null,
            isrc: deezerTrack.isrc || null,
            deezerId: deezerTrack.id,
          };
        } catch {
          return null;
        }
      }),
    );

    const seenDeezerIds = new Set<number>();
    const results = enriched
      .filter((item): item is SimilarTrackResult => item !== null)
      .filter((item) => {
        if (seenDeezerIds.has(item.deezerId)) return false;
        seenDeezerIds.add(item.deezerId);
        return true;
      })
      .slice(0, MAX_SIMILAR_RESULTS);

    await this.cacheManager.set(cacheKey, results, 3600);
    return results;
  }

  async searchSoundCloud(query: string): Promise<SoundCloudSearchResponse> {
    const normalizedQuery = this.normalizeInput(query);
    if (!normalizedQuery) {
      throw new BadRequestException('Search query is required');
    }

    const cacheKey = `search:sc:${normalizedQuery.toLowerCase()}`;

    const cached =
      await this.cacheManager.get<SoundCloudSearchResponse>(cacheKey);
    if (cached) return cached;

    const result = await this.soundCloudService.searchTracks(normalizedQuery);
    await this.cacheManager.set(cacheKey, result);

    return result;
  }
}
