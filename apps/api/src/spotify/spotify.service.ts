import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import type { Cache } from 'cache-manager';
import type { Redis } from 'ioredis';
import { firstValueFrom } from 'rxjs';
import { CACHE_TTL_MS } from 'src/common/cache-ttl';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  DeezerQuotaError,
  DeezerService,
} from 'src/providers/deezer/deezer.service';
import type {
  DeezerTrack,
  DeezerTrackFull,
} from 'src/providers/deezer/deezer.types';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import { SearchService } from 'src/search/search.service';
import {
  SPOTIFY_LIKED_ID,
  type SpotifyImportPageDto,
  type SpotifyPlaylistDto,
  type SpotifyStatusDto,
  type SpotifyUnmatchedTrackDto,
} from './dto/spotify.dto';
import type {
  SpotifyPage,
  SpotifyPlaylist,
  SpotifyPlaylistEntry,
  SpotifySavedTrack,
  SpotifyTokenResponse,
  SpotifyTrack,
  SpotifyUser,
} from './spotify.types';

const ACCOUNTS_URL = 'https://accounts.spotify.com';
const API_URL = 'https://api.spotify.com/v1';
const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
];
const STATE_TTL_SEC = 10 * 60;
const ACCESS_TOKEN_SKEW_SEC = 60;
const PAGE_SIZE = 50;
const MAX_PLAYLISTS = 500;
const MATCH_CONCURRENCY = 4;
const DEEZER_QUOTA_RETRIES = 3;
const DEEZER_QUOTA_BACKOFF_MS = 1500;
/** Wait out a short Spotify 429 inline; anything longer goes back to the app. */
const MAX_INLINE_RETRY_AFTER_SEC = 5;

export class SpotifyNotConnectedException extends ConflictException {
  constructor() {
    super({
      code: 'SPOTIFY_NOT_CONNECTED',
      message: 'Spotify is not connected',
    });
  }
}

type CallbackResult = { ok: true } | { ok: false; reason: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  readonly appRedirectUri: string;
  private readonly tokenKey: Buffer;

  constructor(
    config: ConfigService,
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly deezer: DeezerService,
    private readonly search: SearchService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    this.clientId = config.get<string>('SPOTIFY_CLIENT_ID') ?? '';
    this.clientSecret = config.get<string>('SPOTIFY_CLIENT_SECRET') ?? '';
    this.redirectUri = config.get<string>('SPOTIFY_REDIRECT_URI') ?? '';
    this.appRedirectUri = config.getOrThrow<string>('SPOTIFY_APP_REDIRECT_URI');
    this.tokenKey = createHash('sha256')
      .update(
        `spotify-token:${config.getOrThrow<string>('JWT_REFRESH_SECRET')}`,
      )
      .digest();
  }

  get configured(): boolean {
    return !!(this.clientId && this.clientSecret && this.redirectUri);
  }

  private assertConfigured(): void {
    if (!this.configured) {
      throw new ServiceUnavailableException('Spotify import is not configured');
    }
  }

  // ---- OAuth -------------------------------------------------------------

  async getStatus(userId: string): Promise<SpotifyStatusDto> {
    const connection = await this.prisma.spotifyConnection.findUnique({
      where: { userId },
      select: { displayName: true },
    });
    return {
      configured: this.configured,
      connected: !!connection,
      displayName: connection?.displayName ?? null,
    };
  }

  async createAuthorizeUrl(userId: string): Promise<string> {
    this.assertConfigured();
    const state = randomBytes(24).toString('base64url');
    await this.redis.set(this.stateKey(state), userId, 'EX', STATE_TTL_SEC);

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: SCOPES.join(' '),
      state,
    });
    return `${ACCOUNTS_URL}/authorize?${params.toString()}`;
  }

  async handleCallback(query: {
    code?: string;
    state?: string;
    error?: string;
  }): Promise<CallbackResult> {
    if (!this.configured) return { ok: false, reason: 'not_configured' };
    if (!query.state) return { ok: false, reason: 'invalid_state' };

    const userId = await this.redis.getdel(this.stateKey(query.state));
    if (!userId) return { ok: false, reason: 'invalid_state' };
    if (query.error) return { ok: false, reason: query.error };
    if (!query.code) return { ok: false, reason: 'missing_code' };

    try {
      const token = await this.requestToken({
        grant_type: 'authorization_code',
        code: query.code,
        redirect_uri: this.redirectUri,
      });
      if (!token.refresh_token) {
        return { ok: false, reason: 'missing_refresh_token' };
      }
      const me = await this.apiGetWithToken<SpotifyUser>(
        token.access_token,
        '/me',
      );

      const data = {
        spotifyUserId: me.id,
        displayName: me.display_name,
        refreshToken: this.encrypt(token.refresh_token),
        scope: token.scope,
      };
      await this.prisma.spotifyConnection.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
      });
      await this.cacheAccessToken(userId, token);
      return { ok: true };
    } catch (error) {
      this.logger.warn(`Spotify callback failed: ${this.describe(error)}`);
      return {
        ok: false,
        reason: this.isForbidden(error) ? 'forbidden' : 'exchange_failed',
      };
    }
  }

  async disconnect(userId: string): Promise<void> {
    await this.prisma.spotifyConnection.deleteMany({ where: { userId } });
    await this.redis.del(this.accessKey(userId));
  }

  // ---- Library -----------------------------------------------------------

  async getPlaylists(userId: string): Promise<SpotifyPlaylistDto[]> {
    const connection = await this.requireConnection(userId);

    const liked = await this.apiGet<SpotifyPage<SpotifySavedTrack>>(
      userId,
      '/me/tracks',
      { limit: 1 },
    );
    const result: SpotifyPlaylistDto[] = [
      {
        id: SPOTIFY_LIKED_ID,
        name: 'Liked Songs',
        coverUrl: null,
        total: liked.total,
        readable: true,
      },
    ];

    for (let offset = 0; offset < MAX_PLAYLISTS; offset += PAGE_SIZE) {
      const page = await this.apiGet<SpotifyPage<SpotifyPlaylist | null>>(
        userId,
        '/me/playlists',
        { limit: PAGE_SIZE, offset },
      );
      for (const playlist of page.items) {
        if (!playlist) continue;
        result.push({
          id: playlist.id,
          name: playlist.name,
          coverUrl: playlist.images?.[0]?.url ?? null,
          total: playlist.items?.total ?? playlist.tracks?.total ?? 0,
          readable:
            playlist.collaborative ||
            playlist.owner.id === connection.spotifyUserId,
        });
      }
      if (!page.next) break;
    }

    return result;
  }

  /**
   * One page (50 entries) of a Spotify playlist, matched to Deezer tracks so
   * the app can download them through the regular queue. Paged so a big
   * library never turns into one long request.
   */
  async getImportPage(
    userId: string,
    playlistId: string,
    offset: number,
  ): Promise<SpotifyImportPageDto> {
    await this.requireConnection(userId);

    let spotifyTracks: SpotifyTrack[];
    let total: number;
    let hasNext: boolean;

    if (playlistId === SPOTIFY_LIKED_ID) {
      const page = await this.apiGet<SpotifyPage<SpotifySavedTrack>>(
        userId,
        '/me/tracks',
        { limit: PAGE_SIZE, offset },
      );
      spotifyTracks = page.items.flatMap((entry) =>
        entry.track ? [entry.track] : [],
      );
      total = page.total;
      hasNext = !!page.next;
    } else {
      const page = await this.apiGet<SpotifyPage<SpotifyPlaylistEntry>>(
        userId,
        `/playlists/${encodeURIComponent(playlistId)}/items`,
        { limit: PAGE_SIZE, offset, additional_types: 'track' },
      );
      spotifyTracks = page.items.flatMap((entry) => {
        const track = entry.item ?? entry.track;
        return track && !entry.is_local ? [track] : [];
      });
      total = page.total;
      hasNext = !!page.next;
    }

    const playable = spotifyTracks.filter(
      (track) => track.type === 'track' && !track.is_local && track.name,
    );
    const matches = await this.mapLimit(playable, MATCH_CONCURRENCY, (track) =>
      this.matchTrack(track),
    );

    const tracks: DeezerTrack[] = [];
    const unmatched: SpotifyUnmatchedTrackDto[] = [];
    const seen = new Set<number>();
    playable.forEach((track, index) => {
      const match = matches[index];
      if (!match) {
        unmatched.push({
          title: track.name,
          artist: track.artists.map((a) => a.name).join(', '),
        });
        return;
      }
      if (seen.has(match.id)) return;
      seen.add(match.id);
      tracks.push(match);
    });

    return {
      total,
      nextOffset: hasNext ? offset + PAGE_SIZE : null,
      tracks,
      unmatched,
    };
  }

  // ---- Matching ----------------------------------------------------------

  private async matchTrack(track: SpotifyTrack): Promise<DeezerTrack | null> {
    const isrc = track.external_ids?.isrc?.trim().toUpperCase();
    if (isrc) {
      const byIsrc = await this.findByIsrc(isrc);
      if (byIsrc) return byIsrc;
    }

    const artist = track.artists[0]?.name;
    if (!artist) return null;
    try {
      return await this.withDeezerRetry(() =>
        this.search.matchDeezerTrack(artist, track.name),
      );
    } catch (error) {
      this.logger.warn(
        `Deezer search match failed for "${artist} - ${track.name}": ${this.describe(error)}`,
      );
      return null;
    }
  }

  private async findByIsrc(isrc: string): Promise<DeezerTrack | null> {
    const cacheKey = `deezer:isrc:${isrc}`;
    const cached = await this.cache.get<{ track: DeezerTrack | null }>(
      cacheKey,
    );
    if (cached) return cached.track;

    try {
      const full = await this.withDeezerRetry(() =>
        this.deezer.getTrackByIsrc(isrc),
      );
      const track = full ? this.toDeezerTrack(full) : null;
      await this.cache.set(cacheKey, { track }, CACHE_TTL_MS.deezerIsrc);
      return track;
    } catch (error) {
      this.logger.warn(
        `Deezer ISRC lookup failed (${isrc}): ${this.describe(error)}`,
      );
      return null;
    }
  }

  private async withDeezerRetry<T>(fn: () => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (
          !(error instanceof DeezerQuotaError) ||
          attempt >= DEEZER_QUOTA_RETRIES
        ) {
          throw error;
        }
        await sleep(DEEZER_QUOTA_BACKOFF_MS * (attempt + 1));
      }
    }
  }

  private toDeezerTrack(full: DeezerTrackFull): DeezerTrack {
    return {
      id: full.id,
      title: full.title,
      title_short: full.title_short,
      isrc: full.isrc,
      link: full.link,
      duration: full.duration,
      rank: full.rank,
      explicit_lyrics: full.explicit_lyrics,
      preview: full.preview,
      md5_image: full.md5_image,
      artist: full.artist,
      album: full.album,
      type: 'track',
    };
  }

  private async mapLimit<T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    const worker = async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await fn(items[index]);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(limit, items.length) }, worker),
    );
    return results;
  }

  // ---- Spotify HTTP ------------------------------------------------------

  private async requireConnection(userId: string) {
    this.assertConfigured();
    const connection = await this.prisma.spotifyConnection.findUnique({
      where: { userId },
    });
    if (!connection) throw new SpotifyNotConnectedException();
    return connection;
  }

  private async getAccessToken(userId: string): Promise<string> {
    const cached = await this.redis.get(this.accessKey(userId));
    if (cached) return cached;

    const connection = await this.requireConnection(userId);
    let refreshToken: string;
    try {
      refreshToken = this.decrypt(connection.refreshToken);
    } catch {
      await this.disconnect(userId);
      throw new SpotifyNotConnectedException();
    }

    let token: SpotifyTokenResponse;
    try {
      token = await this.requestToken({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });
    } catch (error) {
      const status = (error as AxiosError).response?.status;
      if (status === 400 || status === 401) {
        // Revoked in Spotify settings or the app was reset: ask to reconnect.
        await this.disconnect(userId);
        throw new SpotifyNotConnectedException();
      }
      throw this.toHttpException(error);
    }

    if (token.refresh_token) {
      await this.prisma.spotifyConnection.update({
        where: { userId },
        data: { refreshToken: this.encrypt(token.refresh_token) },
      });
    }
    await this.cacheAccessToken(userId, token);
    return token.access_token;
  }

  private async cacheAccessToken(
    userId: string,
    token: SpotifyTokenResponse,
  ): Promise<void> {
    const ttl = Math.max(30, token.expires_in - ACCESS_TOKEN_SKEW_SEC);
    await this.redis.set(this.accessKey(userId), token.access_token, 'EX', ttl);
  }

  private async requestToken(
    body: Record<string, string>,
  ): Promise<SpotifyTokenResponse> {
    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      'base64',
    );
    const { data } = await firstValueFrom(
      this.http.post<SpotifyTokenResponse>(
        `${ACCOUNTS_URL}/api/token`,
        new URLSearchParams(body).toString(),
        {
          headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );
    return data;
  }

  private async apiGet<T>(
    userId: string,
    path: string,
    params?: Record<string, string | number>,
  ): Promise<T> {
    const token = await this.getAccessToken(userId);
    try {
      return await this.apiGetWithToken<T>(token, path, params);
    } catch (error) {
      if ((error as AxiosError).response?.status === 401) {
        // Token expired early or was revoked: refresh once and retry.
        await this.redis.del(this.accessKey(userId));
        const fresh = await this.getAccessToken(userId);
        try {
          return await this.apiGetWithToken<T>(fresh, path, params);
        } catch (retryError) {
          throw this.toHttpException(retryError);
        }
      }
      throw this.toHttpException(error);
    }
  }

  private async apiGetWithToken<T>(
    token: string,
    path: string,
    params?: Record<string, string | number>,
    allowRetry = true,
  ): Promise<T> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<T>(`${API_URL}${path}`, {
          params,
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      return data;
    } catch (error) {
      const response = (error as AxiosError).response;
      if (response?.status === 429 && allowRetry) {
        const retryAfter = Number(response.headers['retry-after'] ?? 1);
        if (retryAfter <= MAX_INLINE_RETRY_AFTER_SEC) {
          await sleep(Math.max(1, retryAfter) * 1000);
          return this.apiGetWithToken<T>(token, path, params, false);
        }
      }
      throw error;
    }
  }

  private toHttpException(error: unknown): Error {
    const response = (error as AxiosError).response;
    if (!response) return error as Error;
    if (response.status === 429) {
      return new ServiceUnavailableException({
        code: 'SPOTIFY_RATE_LIMITED',
        message: 'Spotify rate limit, try again later',
        retryAfter: Number(response.headers['retry-after'] ?? 0) || null,
      });
    }
    if (response.status === 403) {
      // Development-mode apps only answer for users added in the dashboard.
      return new ForbiddenException({
        code: 'SPOTIFY_FORBIDDEN',
        message: 'Spotify refused access for this account',
      });
    }
    if (response.status === 404) {
      return new NotFoundException({
        code: 'SPOTIFY_NOT_FOUND',
        message: 'Spotify playlist not found',
      });
    }
    this.logger.warn(`Spotify API error: ${this.describe(error)}`);
    return new ServiceUnavailableException('Spotify request failed');
  }

  private isForbidden(error: unknown): boolean {
    return (error as AxiosError).response?.status === 403;
  }

  private describe(error: unknown): string {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      return `HTTP ${axiosError.response.status} ${JSON.stringify(axiosError.response.data).slice(0, 300)}`;
    }
    return error instanceof Error ? error.message : String(error);
  }

  // ---- Helpers -----------------------------------------------------------

  private stateKey(state: string): string {
    return `spotify:oauth:${state}`;
  }

  private accessKey(userId: string): string {
    return `spotify:access:${userId}`;
  }

  private encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.tokenKey, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    return [iv, cipher.getAuthTag(), ciphertext]
      .map((part) => part.toString('base64url'))
      .join('.');
  }

  private decrypt(value: string): string {
    const [iv, tag, ciphertext] = value
      .split('.')
      .map((part) => Buffer.from(part, 'base64url'));
    const decipher = createDecipheriv('aes-256-gcm', this.tokenKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  }
}
