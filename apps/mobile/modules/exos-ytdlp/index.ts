import { NativeModule, requireOptionalNativeModule } from 'expo';

export type YtdlpProgressEvent = {
  id: string;
  /** 0..100, or -1 before yt-dlp reports a percentage. */
  progress: number;
  etaSeconds: number;
  line: string;
};

type Timed<T> = T & { elapsedMs: number };

declare class ExosYtdlpNative extends NativeModule<{
  onProgress: (event: YtdlpProgressEvent) => void;
}> {
  init(): Promise<Timed<{ version: string | null }>>;
  update(
    channel: 'stable' | 'nightly',
  ): Promise<{ status: string; version: string | null }>;
  resolve(
    id: string,
    url: string,
    format: string,
    extraArgs: string[],
  ): Promise<Timed<{ json: string; log: string }>>;
  download(
    id: string,
    url: string,
    format: string,
    extraArgs: string[],
    outTemplate: string,
  ): Promise<Timed<{ json: string; log: string }>>;
  startupCost(): Promise<Timed<object>>;
  cancel(id: string): boolean;
  outputDir(): string;
  exportCookies(): Promise<{ count: number; signedIn: boolean }>;
  clearCookies(): Promise<boolean>;
  hasCookies(): boolean;
}

// Missing in Expo Go and on iOS/web: callers check `isYtdlpAvailable`.
const native = requireOptionalNativeModule<ExosYtdlpNative>('ExosYtdlp');

export const isYtdlpAvailable = native != null;

function requireNative(): ExosYtdlpNative {
  if (!native) {
    throw new Error('yt-dlp needs the EXØS APK (not available in Expo Go)');
  }
  return native;
}

export const DEFAULT_AUDIO_FORMAT = 'bestaudio[ext=m4a]/bestaudio/best';

export type YtdlpFormat = {
  format_id?: string;
  url?: string;
  ext?: string;
  acodec?: string;
  abr?: number;
  protocol?: string;
  http_headers?: Record<string, string>;
};

export type YtdlpInfo = YtdlpFormat & {
  id: string;
  title?: string;
  uploader?: string;
  artist?: string;
  track?: string;
  duration?: number;
  thumbnail?: string;
  extractor_key?: string;
  filepath?: string;
  filesize?: number;
  filesize_approx?: number;
  requested_formats?: YtdlpFormat[];
  /** `ytsearch1:` and other playlist inputs wrap the video in `entries`. */
  _type?: string;
  entries?: (YtdlpInfo | null)[];
};

export function initYtdlp() {
  return requireNative().init();
}

export function updateYtdlp(channel: 'stable' | 'nightly' = 'stable') {
  return requireNative().update(channel);
}

export async function resolveYtdlp(
  id: string,
  url: string,
  extraArgs: string[] = [],
  format = DEFAULT_AUDIO_FORMAT,
): Promise<Timed<{ info: YtdlpInfo; log: string }>> {
  const { json, log, elapsedMs } = await requireNative().resolve(
    id,
    url,
    format,
    extraArgs,
  );
  return { info: JSON.parse(json) as YtdlpInfo, log, elapsedMs };
}

/**
 * `outTemplate` is a yt-dlp `-o` template with an absolute path (no
 * `file://`); empty keeps files in the module's own folder.
 */
export async function downloadYtdlp(
  id: string,
  url: string,
  extraArgs: string[] = [],
  format = DEFAULT_AUDIO_FORMAT,
  outTemplate = '',
): Promise<Timed<{ info: YtdlpInfo; log: string }>> {
  const { json, log, elapsedMs } = await requireNative().download(
    id,
    url,
    format,
    extraArgs,
    outTemplate,
  );
  return { info: JSON.parse(json) as YtdlpInfo, log, elapsedMs };
}

/** Milliseconds a bare `yt-dlp --version` takes: Python startup + import. */
export async function measureYtdlpStartup(): Promise<number> {
  const { elapsedMs } = await requireNative().startupCost();
  return elapsedMs;
}

export function cancelYtdlp(id: string): boolean {
  return native?.cancel(id) ?? false;
}

export function onYtdlpProgress(
  listener: (event: YtdlpProgressEvent) => void,
): { remove(): void } | null {
  return native?.addListener('onProgress', listener) ?? null;
}

/**
 * Saves the Google/YouTube cookies from the sign-in WebView for yt-dlp.
 * Writes the file only when the session is signed in.
 */
export function exportYoutubeCookies() {
  return requireNative().exportCookies();
}

/** Signs out: deletes the cookies file and the WebView's cookies. */
export function clearYoutubeCookies() {
  return requireNative().clearCookies();
}

export function hasYoutubeCookies(): boolean {
  return native?.hasCookies() ?? false;
}
