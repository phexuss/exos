import { type ChildProcess, spawn } from 'node:child_process';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { Readable } from 'node:stream';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response as ExpressResponse, Request } from 'express';
import type { Redis } from 'ioredis';
import {
  AudioFormat,
  DownloadDto,
  StreamMode,
} from 'src/download/download.dto';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import youtubedl from 'youtube-dl-exec';

const YTDLP_BIN = '/usr/bin/yt-dlp';
const ALLOWED_DIRECT_URL_HOSTS = ['soundcloud.com', 'youtube.com', 'youtu.be'];
const DOWNLOAD_TICKET_TTL_MS = 2 * 60 * 1000;
/**
 * How long a yt-dlp-resolved direct URL stays in Redis. Most CDNs sign URLs
 * for hours (googlevideo ~6h, sndcdn ~1h), so 30 minutes is a safe window
 * that avoids stale URLs while still amortising yt-dlp cost across many
 * Range requests for the same track.
 */
const DIRECT_URL_CACHE_TTL_SEC = 30 * 60;
const STREAM_PROBE_TIMEOUT_MS = 4000;
const DEFAULT_YOUTUBE_BOT_CHECK_COOLDOWN_SEC = 5 * 60;
const CACHE_BUST_HTTP_STATUSES = new Set([403, 404, 410]);
const YOUTUBE_AUTH_COOKIE_NAMES = new Set([
  'SID',
  'HSID',
  'SSID',
  'APISID',
  'SAPISID',
  'LOGIN_INFO',
  '__Secure-1PAPISID',
  '__Secure-1PSID',
  '__Secure-1PSIDCC',
  '__Secure-1PSIDTS',
  '__Secure-3PAPISID',
  '__Secure-3PSID',
  '__Secure-3PSIDCC',
  '__Secure-3PSIDTS',
]);

class StreamUpstreamError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'StreamUpstreamError';
  }
}

type DownloadTicketPayload = DownloadDto & {
  exp: number;
  sub: string;
  sessionId: string;
};

type CookieDiagnostics = {
  sizeBytes: number;
  modifiedAt: string;
  format: 'netscape' | 'unknown';
  youtubeCookies: number;
  googleCookies: number;
  authCookies: number;
  validAuthCookies: number;
  expiredAuthCookies: number;
};

@Injectable()
export class DownloadService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DownloadService.name);
  private activeYtdlpProcesses = 0;
  /**
   * Cached on boot via `onModuleInit`. We don't re-check `existsSync` on
   * every request — the file is mounted statically, and an `fs.stat` per
   * download would add unnecessary syscall overhead.
   */
  private resolvedCookiesPath: string | null = null;
  private cookieDiagnostics: CookieDiagnostics | null = null;
  private readonly pendingDirectUrlResolves = new Map<
    string,
    Promise<string>
  >();
  /**
   * Live yt-dlp child processes spawned for streaming. Tracked so we can
   * kill them all on graceful shutdown (SIGTERM from Docker/orchestrator)
   * instead of orphaning them past the parent's exit.
   */
  private readonly liveStreamProcesses = new Set<ChildProcess>();

  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  onApplicationShutdown(signal?: string): void {
    if (this.liveStreamProcesses.size === 0) return;
    this.logger.log(
      `Shutdown (${signal ?? 'unknown'}) — killing ${this.liveStreamProcesses.size} in-flight yt-dlp stream(s)`,
    );
    for (const proc of this.liveStreamProcesses) {
      if (!proc.killed) proc.kill('SIGKILL');
    }
    this.liveStreamProcesses.clear();
  }

  onModuleInit(): void {
    // Resolve and validate the cookies path once at boot. YouTube tends to
    // IP-block server ranges with "Sign in to confirm you're not a bot",
    // and the only practical workaround is to pass a Netscape cookies file
    // exported from an authenticated browser session.
    const configured = this.configService
      .get<string>('YTDLP_COOKIES_PATH')
      ?.trim();

    if (!configured) {
      this.logger.warn(
        'YTDLP_COOKIES_PATH is not set. YouTube extraction may fail on ' +
          'server IPs with "Sign in to confirm you\'re not a bot".',
      );
      return;
    }

    if (!existsSync(configured)) {
      this.logger.error(
        `YTDLP_COOKIES_PATH points to a non-existent file: ${configured}. ` +
          'Falling back to no-cookies mode.',
      );
      return;
    }

    if (!statSync(configured).isFile()) {
      this.logger.error(
        `YTDLP_COOKIES_PATH must point to a file, but got: ${configured}. ` +
          'Falling back to no-cookies mode.',
      );
      return;
    }

    this.resolvedCookiesPath = configured;
    try {
      this.cookieDiagnostics = this.inspectCookiesFile(configured);
      this.logger.log(
        `yt-dlp cookies loaded from ${configured} (${this.formatCookieDiagnostics(
          this.cookieDiagnostics,
        )})`,
      );

      if (this.cookieDiagnostics.format !== 'netscape') {
        this.logger.warn(
          'YTDLP_COOKIES_PATH does not look like a Netscape cookies file. ' +
            'yt-dlp may ignore it.',
        );
      }

      if (this.cookieDiagnostics.validAuthCookies === 0) {
        this.logger.warn(
          'YTDLP_COOKIES_PATH has no non-expired YouTube/Google auth cookies ' +
            '(SID/SAPISID/__Secure-*). YouTube bot-check is likely.',
        );
      }
    } catch (e: unknown) {
      this.cookieDiagnostics = null;
      this.logger.warn(
        `yt-dlp cookies loaded from ${configured}, but diagnostics failed: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  private inspectCookiesFile(path: string): CookieDiagnostics {
    const stats = statSync(path);
    const text = readFileSync(path, 'utf8');
    const nowSec = Math.floor(Date.now() / 1000);

    let parsedCookies = 0;
    let youtubeCookies = 0;
    let googleCookies = 0;
    let authCookies = 0;
    let validAuthCookies = 0;
    let expiredAuthCookies = 0;

    for (const line of text.split(/\r?\n/)) {
      const normalized = line.startsWith('#HttpOnly_')
        ? line.slice('#HttpOnly_'.length)
        : line;
      if (!normalized || normalized.startsWith('#')) continue;

      const columns = normalized.split('\t');
      if (columns.length < 7) continue;

      parsedCookies += 1;
      const domain = columns[0].toLowerCase();
      const expires = Number(columns[4]);
      const name = columns[5];
      const isExpired =
        Number.isFinite(expires) && expires > 0 && expires <= nowSec;

      if (domain.includes('youtube.com')) youtubeCookies += 1;
      if (domain.includes('google.com')) googleCookies += 1;

      if (
        (domain.includes('youtube.com') || domain.includes('google.com')) &&
        YOUTUBE_AUTH_COOKIE_NAMES.has(name)
      ) {
        authCookies += 1;
        if (isExpired) expiredAuthCookies += 1;
        else validAuthCookies += 1;
      }
    }

    return {
      sizeBytes: stats.size,
      modifiedAt: stats.mtime.toISOString(),
      format:
        text.includes('Netscape HTTP Cookie File') || parsedCookies > 0
          ? 'netscape'
          : 'unknown',
      youtubeCookies,
      googleCookies,
      authCookies,
      validAuthCookies,
      expiredAuthCookies,
    };
  }

  private formatCookieDiagnostics(diagnostics: CookieDiagnostics): string {
    return (
      `size=${diagnostics.sizeBytes}B mtime=${diagnostics.modifiedAt} ` +
      `format=${diagnostics.format} youtubeCookies=${diagnostics.youtubeCookies} ` +
      `googleCookies=${diagnostics.googleCookies} authCookies=${diagnostics.validAuthCookies}/${diagnostics.authCookies} ` +
      `expiredAuthCookies=${diagnostics.expiredAuthCookies}`
    );
  }

  private get ticketSecret(): string {
    return this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  private get ytdlpPath(): string {
    return this.configService.get<string>('YTDLP_PATH')?.trim() || YTDLP_BIN;
  }

  private get ytdlpTimeoutMs(): number {
    return Math.max(
      1000,
      this.configService.get<number>('YTDLP_TIMEOUT_MS') ?? 10000,
    );
  }

  private get maxConcurrentYtdlpProcesses(): number {
    return Math.max(
      1,
      this.configService.get<number>('YTDLP_MAX_CONCURRENT') ?? 3,
    );
  }

  private get youtubeBotCheckCooldownSec(): number {
    return Math.max(
      30,
      this.configService.get<number>('YTDLP_YOUTUBE_BOT_CHECK_COOLDOWN_SEC') ??
        DEFAULT_YOUTUBE_BOT_CHECK_COOLDOWN_SEC,
    );
  }

  private reserveYtdlpProcess(): () => void {
    if (this.activeYtdlpProcesses >= this.maxConcurrentYtdlpProcesses) {
      throw new ServiceUnavailableException('Too many concurrent downloads');
    }

    this.activeYtdlpProcesses += 1;
    let released = false;

    return () => {
      if (released) return;
      released = true;
      this.activeYtdlpProcesses = Math.max(0, this.activeYtdlpProcesses - 1);
    };
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url');
  }

  private base64UrlDecode(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf8');
  }

  private signTicketPayload(encodedPayload: string): string {
    return createHmac('sha256', this.ticketSecret)
      .update(encodedPayload)
      .digest('base64url');
  }

  private verifyTicketSignature(
    encodedPayload: string,
    signature: string,
  ): boolean {
    const expected = Buffer.from(this.signTicketPayload(encodedPayload));
    const received = Buffer.from(signature);

    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  }

  private isHttpUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  private isAllowedDirectUrl(url: URL): boolean {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    return ALLOWED_DIRECT_URL_HOSTS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  }

  private validateAllowedDirectUrl(query: string): string {
    let url: URL;
    try {
      url = new URL(query);
    } catch {
      throw new BadRequestException('Invalid direct audio URL');
    }

    if (!this.isAllowedDirectUrl(url)) {
      throw new BadRequestException('Direct audio URL host is not allowed');
    }

    return url.toString();
  }

  private resolveSource(dto: DownloadDto): string {
    const query = dto.query.trim();
    if (this.isHttpUrl(query)) {
      return this.validateAllowedDirectUrl(query);
    }
    if (dto.isrc) {
      return `ytsearch1:${dto.isrc.trim()}`;
    }
    return `ytsearch1:${query}`;
  }

  private resolveFormat(format: AudioFormat): string {
    switch (format) {
      case AudioFormat.FLAC:
        return 'bestaudio[ext=flac]/bestaudio';
      case AudioFormat.WEBM:
        return 'bestaudio[ext=webm]/bestaudio';
      case AudioFormat.MP3:
        return 'bestaudio[ext=mp3]/bestaudio';
      default:
        // Prefer native AAC-in-MP4 streams (YouTube itag=140). When no
        // such container exists (SoundCloud only exposes mp3 today),
        // prefer a progressive HTTP variant over HLS — expo-audio's
        // ExoPlayer/AVPlayer backend reports per-segment `duration` for
        // SC's m3u8 manifests, which makes the playback `progress`
        // ratio overshoot by ~6–10x and breaks the seekbar/lyrics
        // timeline. `[protocol^=http]` matches `http`/`https` but
        // excludes `m3u8`/`m3u8_native`. Bare `bestaudio` is kept as
        // the last-ditch fallback so we never error out, and the
        // post-processing pass (`-x --audio-format m4a`) still coerces
        // the final downloaded payload regardless of source codec.
        return 'bestaudio[ext=m4a]/bestaudio[ext=mp4]/bestaudio[ext=aac]/bestaudio[protocol^=http]/bestaudio';
    }
  }

  private isSoundCloudSource(source: string): boolean {
    if (!this.isHttpUrl(source)) return false;

    try {
      const hostname = new URL(source).hostname
        .toLowerCase()
        .replace(/\.$/, '');
      return (
        hostname === 'soundcloud.com' || hostname.endsWith('.soundcloud.com')
      );
    } catch {
      return false;
    }
  }

  private isYouTubeSource(source: string): boolean {
    const lowered = source.toLowerCase();
    if (lowered.startsWith('ytsearch')) return true;
    if (!this.isHttpUrl(source)) return false;

    try {
      const hostname = new URL(source).hostname
        .toLowerCase()
        .replace(/\.$/, '');
      return (
        hostname === 'youtube.com' ||
        hostname.endsWith('.youtube.com') ||
        hostname === 'youtu.be' ||
        hostname.endsWith('.youtu.be')
      );
    } catch {
      return false;
    }
  }

  private get youtubeExtractorArgs(): string | null {
    return (
      this.configService.get<string>('YTDLP_YOUTUBE_EXTRACTOR_ARGS')?.trim() ||
      null
    );
  }

  private getYoutubeExtractorArgs(source: string): string | null {
    if (!this.isYouTubeSource(source)) return null;
    return this.youtubeExtractorArgs;
  }

  private resolveStreamFormat(dto: DownloadDto, source: string): string {
    if (this.isSoundCloudSource(source)) {
      return 'http_mp3_128_url/bestaudio[protocol^=http][ext=mp3]/bestaudio[protocol^=http]/bestaudio';
    }

    return this.resolveFormat(dto.format);
  }

  /**
   * Map the requested {@link AudioFormat} to (a) the HTTP Content-Type we
   * advertise and (b) the value passed to yt-dlp's `--audio-format` flag.
   * Returning `audioFormat = undefined` skips post-processing entirely
   * (used for FLAC where we don't want lossy re-encode).
   */
  private resolveContainer(format: AudioFormat): {
    contentType: string;
    audioFormat?: string;
  } {
    switch (format) {
      case AudioFormat.MP3:
        return { contentType: 'audio/mpeg', audioFormat: 'mp3' };
      case AudioFormat.FLAC:
        return { contentType: 'audio/flac' };
      case AudioFormat.WEBM:
        return { contentType: 'audio/webm' };
      default:
        return { contentType: 'audio/mp4', audioFormat: 'm4a' };
    }
  }

  createStreamTicket(
    dto: DownloadDto,
    user: { sub: string; sessionId: string },
  ): { token: string; expiresAt: number } {
    const expiresAt = Date.now() + DOWNLOAD_TICKET_TTL_MS;
    const payload: DownloadTicketPayload = {
      query: dto.query,
      isrc: dto.isrc,
      format: dto.format,
      mode: dto.mode ?? StreamMode.DOWNLOAD,
      exp: expiresAt,
      sub: user.sub,
      sessionId: user.sessionId,
    };
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.signTicketPayload(encodedPayload);

    return {
      token: `${encodedPayload}.${signature}`,
      expiresAt,
    };
  }

  resolveStreamTicket(token: string): DownloadDto {
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) {
      throw new UnauthorizedException('Invalid download ticket');
    }

    if (!this.verifyTicketSignature(encodedPayload, signature)) {
      throw new UnauthorizedException('Invalid download ticket');
    }

    let payload: DownloadTicketPayload;
    try {
      payload = JSON.parse(this.base64UrlDecode(encodedPayload));
    } catch {
      throw new UnauthorizedException('Invalid download ticket');
    }

    if (!payload.exp || payload.exp <= Date.now()) {
      throw new UnauthorizedException('Download ticket expired');
    }

    if (!payload.query || !payload.format) {
      throw new UnauthorizedException('Invalid download ticket');
    }

    return {
      query: payload.query,
      isrc: payload.isrc,
      format: payload.format,
      // Old tickets minted before `mode` existed default to DOWNLOAD so
      // re-deploys don't break in-flight downloads.
      mode: payload.mode ?? StreamMode.DOWNLOAD,
    };
  }

  async getDownloadUrl(dto: DownloadDto): Promise<{ url: string }> {
    // Kept for any external callers / Swagger smoke tests, but the mobile
    // streaming path no longer uses this — it goes through the cached
    // `streamCachedAudio` flow which avoids the IP-bound URL problem.
    const url = await this.resolveDirectUrl(dto);
    return { url };
  }

  /**
   * Single source of truth for `yt-dlp --get-url`. Honours the global
   * concurrency cap and the configured cookies file.
   */
  private async resolveDirectUrl(dto: DownloadDto): Promise<string> {
    const source = this.resolveSource(dto);
    await this.assertNoRecentYoutubeBotCheck(source);
    const release = this.reserveYtdlpProcess();

    try {
      const mode = dto.mode ?? StreamMode.DOWNLOAD;
      const format =
        mode === StreamMode.STREAM
          ? this.resolveStreamFormat(dto, source)
          : this.resolveFormat(dto.format);
      const ytdlp = youtubedl.create(this.ytdlpPath);

      // `warn` (not `log`/`debug`) so production logs always reveal which
      // `source` was actually fed to yt-dlp — this is the single most useful
      // signal for diagnosing "stream doesn't play" reports (e.g. ytsearch1:
      // vs. direct soundcloud.com URL). Nest's prod log filter drops `log`.
      this.logger.warn(`Resolving source: ${source}`);

      const ytdlpOptions: Record<string, unknown> = {
        getUrl: true,
        format,
        noPlaylist: true,
        extractorRetries: 1,
      };
      if (this.resolvedCookiesPath) {
        // `youtube-dl-exec` maps camelCase keys to `--kebab-case` flags, so
        // `cookies` here becomes `--cookies <path>`.
        ytdlpOptions.cookies = this.resolvedCookiesPath;
      }
      const youtubeExtractorArgs = this.getYoutubeExtractorArgs(source);
      if (youtubeExtractorArgs) {
        ytdlpOptions.extractorArgs = youtubeExtractorArgs;
      }

      const result = (await ytdlp(source, ytdlpOptions, {
        timeout: this.ytdlpTimeoutMs,
        killSignal: 'SIGKILL',
      })) as unknown as string;

      const url = result.trim();
      const host = this.safeUrlHost(url);
      // See note above — `warn` so this is visible in production logs.
      this.logger.warn(
        `Resolved direct URL host=${host} (${url.length} chars) for source=${source}`,
      );

      // Optional sanity probe: when YTDLP_STREAM_URL_PROBE=1 we send a HEAD
      // request from the server to the resolved URL. This lets us tell apart
      // (a) "yt-dlp returned a broken URL" (HEAD fails server-side too) from
      // (b) "URL is IP/session-bound to the server" (HEAD ok server-side, but
      // the mobile client gets 403). We never block the response on probe
      // failures — the diagnostic value comes from the logs, not behaviour.
      if (this.shouldProbeStreamUrl) {
        void this.probeStreamUrl(url, host, source);
      }

      return url;
    } catch (e: unknown) {
      const message = this.getYtdlpErrorText(e);
      const summary = this.summarizeYtdlpError(message);

      if (this.isYoutubeBotCheckText(message)) {
        await this.rememberYoutubeBotCheck(source, summary);
        this.logger.error(
          `YouTube bot-check while resolving source=${source} cookies=${
            this.cookieDiagnostics
              ? this.formatCookieDiagnostics(this.cookieDiagnostics)
              : 'not-configured'
          }: ${summary}`,
        );
        throw new ServiceUnavailableException(
          this.buildYoutubeBotCheckMessage(),
        );
      }

      this.logger.error(`youtube-dl-exec error source=${source}: ${summary}`);
      throw new BadRequestException(`Something went wrong: ${summary}`);
    } finally {
      release();
    }
  }

  private getYtdlpErrorText(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      const maybeStderr = (error as { stderr?: unknown }).stderr;
      if (typeof maybeStderr === 'string' && maybeStderr.trim()) {
        return maybeStderr;
      }
    }
    if (error instanceof Error) return error.message;
    return JSON.stringify(error);
  }

  private summarizeYtdlpError(message: string): string {
    return message
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(-4)
      .join(' | ')
      .slice(0, 1200);
  }

  private isYoutubeBotCheckText(message: string): boolean {
    const normalized = message.toLowerCase().replace(/’/g, "'");
    return (
      normalized.includes("sign in to confirm you're not a bot") ||
      (normalized.includes('sign in to confirm') &&
        normalized.includes('not a bot') &&
        normalized.includes('--cookies'))
    );
  }

  private buildYoutubeBotCheckMessage(): string {
    return (
      'YouTube bot-check is active. Refresh YTDLP_COOKIES_PATH with fresh ' +
      'Netscape cookies from a logged-in browser, then restart/redeploy the API.'
    );
  }

  private buildYoutubeBotCheckKey(source: string): string {
    const digest = createHash('sha256').update(source).digest('base64url');
    return `dl:ytbot:v1:${digest.slice(0, 32)}`;
  }

  private async assertNoRecentYoutubeBotCheck(source: string): Promise<void> {
    if (!this.isYouTubeSource(source)) return;

    try {
      const [globalCooldown, sourceCooldown] = await Promise.all([
        this.redis.get('dl:ytbot:v1:global'),
        this.redis.get(this.buildYoutubeBotCheckKey(source)),
      ]);
      if (globalCooldown || sourceCooldown) {
        this.logger.warn(
          `YouTube bot-check cooldown active for source=${source}`,
        );
        throw new ServiceUnavailableException(
          this.buildYoutubeBotCheckMessage(),
        );
      }
    } catch (e: unknown) {
      if (e instanceof ServiceUnavailableException) throw e;
      this.logger.warn(
        `Redis bot-check cooldown read failed: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  private async rememberYoutubeBotCheck(
    source: string,
    summary: string,
  ): Promise<void> {
    if (!this.isYouTubeSource(source)) return;

    try {
      await Promise.all([
        this.redis.set(
          'dl:ytbot:v1:global',
          summary,
          'EX',
          this.youtubeBotCheckCooldownSec,
        ),
        this.redis.set(
          this.buildYoutubeBotCheckKey(source),
          summary,
          'EX',
          this.youtubeBotCheckCooldownSec,
        ),
      ]);
    } catch (e: unknown) {
      this.logger.warn(
        `Redis bot-check cooldown write failed: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  private buildDirectUrlCacheKey(dto: DownloadDto): string {
    // Format participates in the key because different formats resolve to
    // different yt-dlp tracks. ISRC is included so two queries with the
    // same `query` but different `isrc` don't collide.
    // v2 busts old stream URLs after adding source-specific stream format
    // selection (notably SoundCloud progressive MP3).
    return `dl:url:v2:${dto.mode ?? StreamMode.DOWNLOAD}:${dto.format}:${
      dto.isrc ?? ''
    }:${dto.query}`;
  }

  private async getCachedDirectUrl(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (e: unknown) {
      // Redis hiccups must never break playback — fall through to a fresh
      // yt-dlp resolve. The error log alone is enough signal.
      this.logger.warn(
        `Redis GET failed for ${key}: ${e instanceof Error ? e.message : String(e)}`,
      );
      return null;
    }
  }

  private async cacheDirectUrl(key: string, url: string): Promise<void> {
    try {
      await this.redis.set(key, url, 'EX', DIRECT_URL_CACHE_TTL_SEC);
    } catch (e: unknown) {
      this.logger.warn(
        `Redis SET failed for ${key}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  private async bustCachedDirectUrl(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch {
      /* best-effort */
    }
  }

  private async getOrResolveDirectUrl(dto: DownloadDto): Promise<{
    url: string;
    cacheHit: boolean;
    cacheKey: string;
  }> {
    const cacheKey = this.buildDirectUrlCacheKey(dto);
    const cached = await this.getCachedDirectUrl(cacheKey);
    if (cached) {
      return { url: cached, cacheHit: true, cacheKey };
    }

    const pending = this.pendingDirectUrlResolves.get(cacheKey);
    if (pending) {
      const url = await pending;
      return { url, cacheHit: false, cacheKey };
    }

    const pendingResolve = this.resolveDirectUrl(dto)
      .then(async (url) => {
        await this.cacheDirectUrl(cacheKey, url);
        return url;
      })
      .finally(() => {
        this.pendingDirectUrlResolves.delete(cacheKey);
      });

    this.pendingDirectUrlResolves.set(cacheKey, pendingResolve);
    const url = await pendingResolve;
    return { url, cacheHit: false, cacheKey };
  }

  private get streamDirectHosts(): string[] {
    const raw = this.configService.get<string>('STREAM_DIRECT_HOSTS')?.trim();
    if (!raw) return [];
    return raw
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter((h) => h.length > 0);
  }

  private isDirectStreamHost(host: string): boolean {
    const allowed = this.streamDirectHosts;
    if (allowed.length === 0) return false;
    const normalized = this.normalizeHost(host);
    return allowed.some(
      (entry) => normalized === entry || normalized.endsWith(`.${entry}`),
    );
  }

  private normalizeHost(host: string): string {
    return host.toLowerCase().replace(/\.$/, '').replace(/:\d+$/, '');
  }

  private isSoundCloudMediaHost(host: string): boolean {
    const normalized = this.normalizeHost(host);
    return (
      normalized === 'sndcdn.com' ||
      normalized.endsWith('.sndcdn.com') ||
      normalized === 'soundcloud.cloud' ||
      normalized.endsWith('.soundcloud.cloud')
    );
  }

  private resolveProxyContentType(
    host: string,
    upstreamContentType: string | null,
  ): string | null {
    const mediaType = upstreamContentType?.split(';')[0]?.trim().toLowerCase();
    if (upstreamContentType && mediaType !== 'application/octet-stream') {
      return upstreamContentType;
    }

    if (this.isSoundCloudMediaHost(host)) {
      return 'audio/mpeg';
    }

    return upstreamContentType;
  }

  /**
   * Stream-mode entrypoint. Reuses a Redis-cached direct URL across Range
   * requests so yt-dlp is only invoked on cache miss (and on cache-bust
   * after upstream returns 403/404/410 — meaning the signed URL expired
   * sooner than expected). When `STREAM_DIRECT_HOSTS` matches the resolved
   * host, the client is sent a 302 redirect instead of being proxied —
   * useful when you're confident the source CDN is not IP-bound.
   */
  async streamCachedAudio(
    dto: DownloadDto,
    req: Request,
    res: ExpressResponse,
  ): Promise<void> {
    const { url, cacheHit, cacheKey } = await this.getOrResolveDirectUrl(dto);
    const host = this.safeUrlHost(url);

    if (this.isDirectStreamHost(host)) {
      this.logger.warn(
        `Stream redirect (host=${host} cacheHit=${cacheHit}) — STREAM_DIRECT_HOSTS match`,
      );
      res.redirect(302, url);
      return;
    }

    try {
      await this.proxyRangeStream(url, req, res, host, cacheHit);
    } catch (e: unknown) {
      // Headers may already be sent if the client started receiving bytes —
      // we can't recover the response stream in that case, just bail.
      if (res.headersSent || res.writableEnded) {
        return;
      }

      if (
        e instanceof StreamUpstreamError &&
        CACHE_BUST_HTTP_STATUSES.has(e.status) &&
        cacheHit
      ) {
        this.logger.warn(
          `Cached URL appears expired (host=${host} status=${e.status}) — refreshing`,
        );
        await this.bustCachedDirectUrl(cacheKey);
        const fresh = await this.resolveDirectUrl(dto);
        await this.cacheDirectUrl(cacheKey, fresh);
        const freshHost = this.safeUrlHost(fresh);

        if (this.isDirectStreamHost(freshHost)) {
          res.redirect(302, fresh);
          return;
        }

        try {
          await this.proxyRangeStream(fresh, req, res, freshHost, false);
          return;
        } catch (retryErr: unknown) {
          this.handleStreamFailure(retryErr, freshHost, res);
          return;
        }
      }

      this.handleStreamFailure(e, host, res);
    }
  }

  private handleStreamFailure(
    error: unknown,
    host: string,
    res: ExpressResponse,
  ): void {
    if (error instanceof StreamUpstreamError) {
      this.logger.error(
        `Upstream stream error host=${host} status=${error.status}: ${error.message}`,
      );
      if (!res.headersSent) {
        // Mirror the upstream status when reasonable, otherwise 502.
        const proxied =
          error.status >= 400 && error.status < 600 ? error.status : 502;
        res.status(proxied);
      }
      if (!res.writableEnded) res.end();
      return;
    }

    const message =
      error instanceof Error ? error.message : JSON.stringify(error);
    this.logger.error(`Proxy stream failed host=${host}: ${message}`);
    if (!res.headersSent) res.status(502);
    if (!res.writableEnded) res.end();
  }

  private async proxyRangeStream(
    url: string,
    req: Request,
    res: ExpressResponse,
    host: string,
    cacheHit: boolean,
  ): Promise<void> {
    const upstreamHeaders: Record<string, string> = {
      // Generic UA — most CDNs are lenient. Some sndcdn signed URLs check
      // UA loosely; this avoids being identified as a bot/curl.
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    };
    const range = req.headers.range;
    if (typeof range === 'string' && range.length > 0) {
      upstreamHeaders.Range = range;
    }

    this.logger.warn(
      `Proxy stream start host=${host} range=${range ?? 'none'} cacheHit=${cacheHit}`,
    );

    const controller = new AbortController();
    // If the client disconnects mid-stream, abort the upstream fetch so we
    // don't keep pulling bytes for nobody.
    const onClientClose = () => controller.abort();
    res.on('close', onClientClose);

    let upstreamBody: globalThis.ReadableStream<Uint8Array> | null = null;
    try {
      const fetchResponse = await fetch(url, {
        method: 'GET',
        headers: upstreamHeaders,
        signal: controller.signal,
      });
      upstreamBody = fetchResponse.body;

      if (!fetchResponse.ok) {
        // Drain to release the connection.
        try {
          await fetchResponse.body?.cancel();
        } catch {
          /* noop */
        }
        throw new StreamUpstreamError(
          fetchResponse.status,
          `Upstream HTTP ${fetchResponse.status}`,
        );
      }

      const upstreamContentType = fetchResponse.headers.get('content-type');
      const upstreamContentLength = fetchResponse.headers.get('content-length');
      const upstreamContentRange = fetchResponse.headers.get('content-range');
      const upstreamAcceptRanges = fetchResponse.headers.get('accept-ranges');
      this.logger.warn(
        `Proxy stream upstream host=${host} status=${fetchResponse.status} ` +
          `contentType=${upstreamContentType ?? 'none'} ` +
          `contentLength=${upstreamContentLength ?? 'none'} ` +
          `contentRange=${upstreamContentRange ?? 'none'} ` +
          `acceptRanges=${upstreamAcceptRanges ?? 'none'}`,
      );

      const contentType = this.resolveProxyContentType(
        host,
        upstreamContentType,
      );
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }

      // Forward useful headers so the player can seek properly.
      const passthrough = [
        'content-length',
        'content-range',
        'accept-ranges',
        'etag',
        'last-modified',
      ] as const;
      for (const header of passthrough) {
        const value = fetchResponse.headers.get(header);
        if (value) res.setHeader(header, value);
      }
      // If the upstream didn't advertise Accept-Ranges but did honour our
      // Range request (status 206), advertise bytes — players use this hint
      // to decide whether seeking is supported.
      if (
        !fetchResponse.headers.get('accept-ranges') &&
        fetchResponse.status === 206
      ) {
        res.setHeader('Accept-Ranges', 'bytes');
      }
      res.setHeader('Cache-Control', 'no-store');

      res.status(fetchResponse.status);

      if (!fetchResponse.body) {
        res.end();
        return;
      }

      // Convert the WHATWG ReadableStream into a Node Readable so we can
      // pipe it. `Readable.fromWeb` is the canonical bridge in Node 18+.
      const nodeStream = Readable.fromWeb(
        fetchResponse.body as unknown as Parameters<typeof Readable.fromWeb>[0],
      );

      await new Promise<void>((resolve, reject) => {
        nodeStream.on('error', reject);
        res.on('error', reject);
        res.on('finish', resolve);
        res.on('close', resolve);
        nodeStream.pipe(res);
      });
    } finally {
      res.off('close', onClientClose);
      // If we threw before piping, drain any buffered upstream body.
      if (upstreamBody && !res.writableEnded) {
        try {
          await upstreamBody.cancel();
        } catch {
          /* noop */
        }
      }
    }
  }

  private get shouldProbeStreamUrl(): boolean {
    return (
      this.configService.get<string>('YTDLP_STREAM_URL_PROBE')?.trim() === '1'
    );
  }

  private safeUrlHost(value: string): string {
    try {
      return new URL(value).host;
    } catch {
      return 'unparsable';
    }
  }

  private async probeStreamUrl(
    url: string,
    host: string,
    source: string,
  ): Promise<void> {
    const startedAt = Date.now();
    try {
      // Range: bytes=0-0 — most CDNs honour it for HEAD-equivalent semantics
      // even when they don't return Content-Length on a bare HEAD. Use a tight
      // timeout: this is purely diagnostic and must never delay user response.
      const controller = new AbortController();
      const abortTimer = setTimeout(
        () => controller.abort(),
        STREAM_PROBE_TIMEOUT_MS,
      );
      const response = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        signal: controller.signal,
      });
      clearTimeout(abortTimer);
      // Drain & discard — we only care about the status line.
      try {
        await response.body?.cancel();
      } catch {
        /* noop */
      }
      const elapsed = Date.now() - startedAt;
      // `warn` so the probe result survives prod log filtering. Status itself
      // tells you whether yt-dlp's URL is even valid from the server's POV.
      this.logger.warn(
        `Stream URL probe host=${host} status=${response.status} elapsed=${elapsed}ms source=${source}`,
      );
    } catch (e: unknown) {
      const elapsed = Date.now() - startedAt;
      const message = e instanceof Error ? e.message : JSON.stringify(e);
      this.logger.warn(
        `Stream URL probe failed host=${host} elapsed=${elapsed}ms source=${source}: ${message}`,
      );
    }
  }

  async streamAudio(dto: DownloadDto, res: ExpressResponse): Promise<void> {
    const source = this.resolveSource(dto);
    await this.assertNoRecentYoutubeBotCheck(source);
    const format = this.resolveFormat(dto.format);
    const { contentType, audioFormat } = this.resolveContainer(dto.format);

    this.logger.debug(
      `Streaming source=${source} format=${format} contentType=${contentType} audioFormat=${audioFormat ?? 'none'}`,
    );

    const args: string[] = [
      source,
      '-f',
      format,
      '-o',
      '-',
      '-q',
      '--no-playlist',
      '--extractor-retries',
      '1',
    ];

    if (this.resolvedCookiesPath) {
      // See `onModuleInit` for why this exists. We push it BEFORE the
      // optional `-x` post-processing flags so the cookies apply to the
      // network fetch as well as any HLS/dash fragment requests.
      args.push('--cookies', this.resolvedCookiesPath);
    }
    const youtubeExtractorArgs = this.getYoutubeExtractorArgs(source);
    if (youtubeExtractorArgs) {
      args.push('--extractor-args', youtubeExtractorArgs);
    }

    if (audioFormat) {
      // `-x --audio-format <fmt>` makes yt-dlp guarantee the output
      // container/codec: copy when the source already matches, ffmpeg
      // re-encode otherwise. This is the single source of truth for the
      // file format the mobile client receives, so the client can rely on
      // the file extension matching the actual contents.
      args.push('-x', '--audio-format', audioFormat);
    }

    const release = this.reserveYtdlpProcess();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');

    const proc = spawn(this.ytdlpPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.liveStreamProcesses.add(proc);

    let wroteOutput = false;
    let stderrBuf = '';
    // Cap stderr buffering: yt-dlp can emit megabytes of progress/retry chatter
    // on problematic sources. We only need the tail for diagnostics.
    const STDERR_MAX = 16 * 1024;
    const startupTimer = setTimeout(() => {
      if (!wroteOutput && !proc.killed) {
        this.logger.warn(
          `yt-dlp produced no output within ${this.ytdlpTimeoutMs}ms, killing process`,
        );
        proc.kill('SIGKILL');
      }
    }, this.ytdlpTimeoutMs);
    startupTimer.unref();

    const finalizeProcess = () => {
      clearTimeout(startupTimer);
      this.liveStreamProcesses.delete(proc);
      release();
    };

    proc.stdout.on('data', () => {
      wroteOutput = true;
      clearTimeout(startupTimer);
    });
    proc.stderr.on('data', (chunk: Buffer) => {
      if (stderrBuf.length >= STDERR_MAX) return;
      stderrBuf += chunk.toString();
      if (stderrBuf.length > STDERR_MAX) {
        // Keep the tail — the last lines tend to carry the actual error.
        stderrBuf = stderrBuf.slice(-STDERR_MAX);
      }
    });

    proc.on('error', (err) => {
      finalizeProcess();
      this.logger.error(`yt-dlp spawn error: ${err.message}`);
      if (!res.headersSent) {
        res.status(500);
      }
      if (!res.writableEnded) {
        res.end();
      }
    });

    proc.on('close', async (code) => {
      finalizeProcess();
      if (code !== 0) {
        const summary = this.summarizeYtdlpError(stderrBuf);
        if (this.isYoutubeBotCheckText(stderrBuf)) {
          await this.rememberYoutubeBotCheck(source, summary);
          this.logger.error(
            `YouTube bot-check while streaming source=${source} cookies=${
              this.cookieDiagnostics
                ? this.formatCookieDiagnostics(this.cookieDiagnostics)
                : 'not-configured'
            }: ${summary}`,
          );
          if (!wroteOutput && !res.headersSent) {
            res.status(503);
          }
          if (!res.writableEnded) {
            res.end();
          }
          return;
        }

        this.logger.error(`yt-dlp exited with code ${code}: ${summary}`);
        if (!wroteOutput && !res.headersSent) {
          res.status(502);
        }
        if (!res.writableEnded) {
          res.end();
        }
      } else {
        this.logger.debug(`yt-dlp finished streaming for ${source}`);
      }
    });

    res.on('close', () => {
      if (!proc.killed) {
        this.logger.debug('Client disconnected, killing yt-dlp process');
        proc.kill('SIGKILL');
      }
    });

    proc.stdout.pipe(res);
  }
}
