import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import type {
  DeezerChartResponse,
  DeezerErrorResponse,
  DeezerSearchResponse,
  DeezerTrackFull,
} from 'src/providers/deezer/deezer.types';

const DEEZER_QUOTA_ERROR_CODE = 4;
const DEEZER_NOT_FOUND_ERROR_CODE = 800;

export class DeezerQuotaError extends ServiceUnavailableException {
  constructor() {
    super('Deezer quota exceeded, try again shortly');
    this.name = 'DeezerQuotaError';
  }
}

type Shape = 'list' | 'entity' | 'chart';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDeezerError(value: unknown): value is DeezerErrorResponse {
  return isRecord(value) && isRecord(value.error);
}

function hasShape(value: unknown, shape: Shape): boolean {
  if (!isRecord(value)) return false;
  switch (shape) {
    case 'list':
      return Array.isArray(value.data);
    case 'entity':
      return typeof value.id === 'number';
    case 'chart':
      return isRecord(value.tracks) && Array.isArray(value.tracks.data);
  }
}

/**
 * Deezer reports quota hits and outages as HTTP 200 with an `{ error }` body.
 * Every call goes through `request`, which throws on such bodies (and on
 * anything that does not look like the expected payload), so callers only
 * ever cache real data.
 */
@Injectable()
export class DeezerService {
  private readonly BASE_URL = 'https://api.deezer.com';

  constructor(private readonly httpService: HttpService) {}

  private async request<T>(
    path: string,
    shape: Shape,
    params?: Record<string, string | number>,
  ): Promise<T> {
    const { data } = await firstValueFrom(
      this.httpService.get<unknown>(`${this.BASE_URL}${path}`, { params }),
    );

    if (isDeezerError(data)) {
      const code = Number(data.error.code);
      if (code === DEEZER_QUOTA_ERROR_CODE) throw new DeezerQuotaError();
      if (code === DEEZER_NOT_FOUND_ERROR_CODE) {
        throw new NotFoundException('Not found on Deezer');
      }
      throw new BadGatewayException(`Deezer error ${code || 'unknown'}`);
    }

    if (!hasShape(data, shape)) {
      throw new BadGatewayException('Unexpected response from Deezer');
    }

    return data as T;
  }

  searchTracks(query: string): Promise<DeezerSearchResponse> {
    return this.request('/search', 'list', { q: query });
  }

  getTrack(id: number): Promise<DeezerTrackFull> {
    return this.request(`/track/${id}`, 'entity');
  }

  /**
   * Exact lookup by ISRC. An unknown code is a normal miss, so it resolves to
   * null; a spent quota throws `DeezerQuotaError` for the caller to retry.
   */
  async getTrackByIsrc(isrc: string): Promise<DeezerTrackFull | null> {
    try {
      return await this.request<DeezerTrackFull>(
        `/track/isrc:${encodeURIComponent(isrc)}`,
        'entity',
      );
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw Deezer payload passed through
  getArtist(id: number): Promise<any> {
    return this.request(`/artist/${id}`, 'entity');
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw Deezer payload passed through
  getArtistTracks(id: number): Promise<any> {
    return this.request(`/artist/${id}/top`, 'list', { limit: 50 });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw Deezer payload passed through
  getArtistAlbums(id: number): Promise<any> {
    return this.request(`/artist/${id}/albums`, 'list');
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw Deezer payload passed through
  getAlbum(id: number): Promise<any> {
    return this.request(`/album/${id}`, 'entity');
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw Deezer payload passed through
  getAlbumTracks(id: number): Promise<any> {
    return this.request(`/album/${id}/tracks`, 'list');
  }

  getChart(): Promise<DeezerChartResponse> {
    return this.request('/chart', 'chart');
  }
}
