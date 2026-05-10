import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  type DeezerChartResponse,
  type DeezerSearchResponse,
  type DeezerTrackFull,
} from 'src/providers/deezer/deezer.types';

@Injectable()
export class DeezerService {
  private readonly BASE_URL = 'https://api.deezer.com';

  constructor(private readonly httpService: HttpService) {}

  async searchTracks(query: string): Promise<DeezerSearchResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<DeezerSearchResponse>(`${this.BASE_URL}/search`, {
        params: { q: query },
      }),
    );
    return data;
  }

  async getTrack(id: number): Promise<DeezerTrackFull> {
    const { data } = await firstValueFrom(
      this.httpService.get<DeezerTrackFull>(`${this.BASE_URL}/track/${id}`),
    );
    return data;
  }

  async getArtist(id: number) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.BASE_URL}/artist/${id}`),
    );
    return data;
  }

  async getArtistTracks(id: number) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.BASE_URL}/artist/${id}/top?limit=50`),
    );
    return data;
  }

  async getArtistAlbums(id: number) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.BASE_URL}/artist/${id}/albums`),
    );
    return data;
  }

  async getAlbum(id: number) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.BASE_URL}/album/${id}`),
    );
    return data;
  }

  async getAlbumTracks(id: number) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.BASE_URL}/album/${id}/tracks`),
    );
    return data;
  }

  async getChart(): Promise<DeezerChartResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<DeezerChartResponse>(`${this.BASE_URL}/chart`),
    );
    return data;
  }
}
