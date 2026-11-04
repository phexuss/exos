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
  ): Promise<Timed<{ json: string }>>;
  download(
    id: string,
    url: string,
    format: string,
  ): Promise<Timed<{ json: string }>>;
  cancel(id: string): boolean;
  outputDir(): string;
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
  format = DEFAULT_AUDIO_FORMAT,
): Promise<Timed<{ info: YtdlpInfo }>> {
  const { json, elapsedMs } = await requireNative().resolve(id, url, format);
  return { info: JSON.parse(json) as YtdlpInfo, elapsedMs };
}

export async function downloadYtdlp(
  id: string,
  url: string,
  format = DEFAULT_AUDIO_FORMAT,
): Promise<Timed<{ info: YtdlpInfo }>> {
  const { json, elapsedMs } = await requireNative().download(id, url, format);
  return { info: JSON.parse(json) as YtdlpInfo, elapsedMs };
}

export function cancelYtdlp(id: string): boolean {
  return native?.cancel(id) ?? false;
}

export function onYtdlpProgress(
  listener: (event: YtdlpProgressEvent) => void,
): { remove(): void } | null {
  return native?.addListener('onProgress', listener) ?? null;
}
