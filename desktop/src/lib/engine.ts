/**
 * The local audio engine: yt-dlp (+ ffmpeg, + a JS runtime for YouTube)
 * running on this computer in Electron's utility process (electron/engine).
 * In the browser prototype it is simulated.
 */
import { bridge, call } from './bridge';
import { IS_MOCK } from './env';
import type { LocalTrack, Track } from './types';

export type ToolInfo = { path: string; version: string; managed: boolean };

export type EngineStatus = {
  ytdlp: ToolInfo | null;
  ffmpeg: ToolInfo | null;
  /** deno / node / bun: yt-dlp needs one to solve YouTube's JS challenges. */
  jsRuntime: (ToolInfo & { name: string }) | null;
  musicDir: string;
  dataDir: string;
  /** Which tools this platform can download by itself. */
  installable: { ytdlp: boolean; ffmpeg: boolean; deno: boolean };
};

export type Tool = 'ytdlp' | 'ffmpeg' | 'deno';

export type SourceRequest = {
  query: string;
  isrc?: string;
  source: Track['source'];
  cookiesBrowser?: string;
};

/** `sourceUrl`: the YouTube video a search landed on, remembered to skip the search next time. */
export type ResolvedStream = { url: string; protocol: string; ext: string; sourceUrl?: string };

export type DownloadRequest = SourceRequest & {
  id: string;
  title: string;
  artist: string;
  album?: string;
  format: 'opus' | 'm4a' | 'mp3';
  /** kbit/s, for MP3 only. */
  bitrate?: number;
  dir: string;
};

export type DownloadProgress = {
  id: string;
  stage: 'resolving' | 'downloading' | 'converting' | 'done' | 'error';
  progress: number;
  speed?: string;
  eta?: string;
  error?: string;
};

const SOURCES_KEY = 'exos.sourceUrls';
const SOURCES_MAX = 3000;
let sources: Record<string, string> | null = null;

function loadSources(): Record<string, string> {
  if (sources) return sources;
  try {
    sources = JSON.parse(localStorage.getItem(SOURCES_KEY) ?? '{}') as Record<string, string>;
  } catch {
    sources = {};
  }
  return sources;
}

/** Remembers which video a Deezer track resolved to; searching is the slow half of a resolve. */
export function rememberSource(trackId: string, url: string | undefined) {
  const map = loadSources();
  if (url) map[trackId] = url;
  else delete map[trackId];
  const keys = Object.keys(map);
  if (keys.length > SOURCES_MAX) for (const k of keys.slice(0, keys.length - SOURCES_MAX)) delete map[k];
  try {
    localStorage.setItem(SOURCES_KEY, JSON.stringify(map));
  } catch {}
}

export function rememberedSource(trackId: string): string | undefined {
  return loadSources()[trackId];
}

export function sourceRequest(track: Track, cookiesBrowser?: string): SourceRequest {
  const scUrl =
    track.source === 'soundcloud' && track.isrc?.startsWith('http') ? track.isrc : null;
  const known = scUrl ? undefined : rememberedSource(track.id);
  return {
    query: scUrl ?? known ?? `${track.artist.name} ${track.title}`,
    isrc: scUrl || known ? undefined : track.isrc,
    source: track.source,
    cookiesBrowser: cookiesBrowser || undefined,
  };
}

const invoke = call;

export function listen<T>(event: string, fn: (payload: T) => void): () => void {
  if (IS_MOCK || !bridge) return () => {};
  return bridge.on(event, (p) => fn(p as T));
}

const mockStatus: EngineStatus = {
  ytdlp: { path: '~/.local/share/exos/bin/yt-dlp', version: '2026.10.22', managed: true },
  ffmpeg: { path: '/usr/bin/ffmpeg', version: '7.1', managed: false },
  jsRuntime: { name: 'deno', path: '~/.local/share/exos/bin/deno', version: '2.5.4', managed: true },
  musicDir: '~/Music/EXØS',
  dataDir: '~/.local/share/exos',
  installable: { ytdlp: true, ffmpeg: true, deno: true },
};

export type CookieCheck = { count: number; youtube: number; signedIn: boolean };

export const engine = {
  status: () => (IS_MOCK ? Promise.resolve(mockStatus) : invoke<EngineStatus>('engine_status')),
  install: (tool: Tool) =>
    IS_MOCK ? new Promise<void>((r) => setTimeout(r, 1200)) : invoke<void>('engine_install', { tool }),
  updateYtdlp: () =>
    IS_MOCK ? Promise.resolve('2026.10.22') : invoke<string>('engine_update_ytdlp'),
  resolveStream: (req: SourceRequest) =>
    IS_MOCK
      ? new Promise<ResolvedStream>((r) =>
          setTimeout(() => r({ url: 'mock://stream', protocol: 'https', ext: 'm4a' }), 700),
        )
      : invoke<ResolvedStream>('resolve_stream', { req }),
  /** Downloads into the playback cache (for HLS-only sources); returns a file path. */
  cacheTrack: (id: string, req: SourceRequest) =>
    IS_MOCK ? Promise.resolve('mock://cache') : invoke<string>('cache_track', { id, req }),
  download: (req: DownloadRequest) =>
    IS_MOCK ? mockDownload(req) : invoke<{ filePath: string; format: string }>('download_track', { req }),
  cancel: (id: string) => (IS_MOCK ? Promise.resolve() : invoke<void>('cancel_download', { id })),
  readLibrary: () =>
    IS_MOCK ? Promise.resolve(null) : invoke<LocalTrack[] | null>('library_read'),
  writeLibrary: (tracks: LocalTrack[]) =>
    IS_MOCK ? Promise.resolve() : invoke<void>('library_write', { tracks }),
  deleteFile: (path: string) =>
    IS_MOCK ? Promise.resolve() : invoke<void>('delete_file', { path }),
  fileExists: (path: string) =>
    IS_MOCK ? Promise.resolve(true) : invoke<boolean>('file_exists', { path }),
  /** Reads the browser's cookies now and reports what yt-dlp got. */
  checkCookies: (browser: string) =>
    IS_MOCK
      ? new Promise<CookieCheck>((r) => setTimeout(() => r({ count: 0, youtube: 0, signedIn: false }), 600))
      : invoke<CookieCheck>('check_cookies', { browser }),
};

export async function revealInFolder(path: string): Promise<void> {
  if (IS_MOCK || !bridge) return;
  await bridge.shell.reveal(path);
}

/** Opens a folder in the file manager (created if missing). */
export async function openFolder(path: string): Promise<void> {
  if (IS_MOCK || !bridge) return;
  await bridge.shell.openFolder(path);
}

export async function pickFolder(): Promise<string | null> {
  if (IS_MOCK || !bridge) return null;
  return bridge.shell.pickFolder();
}

/** URL the <audio> element can play for a file on disk, served by the app's loopback server. */
export async function fileUrl(path: string): Promise<string> {
  if (IS_MOCK) return path;
  return invoke<string>('media_file', { path });
}

/* ---------- simulated download for the prototype ---------- */

const mockListeners = new Set<(p: DownloadProgress) => void>();
export function onMockProgress(fn: (p: DownloadProgress) => void): () => void {
  mockListeners.add(fn);
  return () => mockListeners.delete(fn);
}

function mockDownload(req: DownloadRequest): Promise<{ filePath: string; format: string }> {
  return new Promise((resolve) => {
    let p = 0;
    const emit = (d: DownloadProgress) => {
      for (const fn of mockListeners) fn(d);
    };
    emit({ id: req.id, stage: 'resolving', progress: 0 });
    setTimeout(() => {
      const timer = setInterval(() => {
        p = Math.min(1, p + 0.06 + Math.random() * 0.08);
        emit({ id: req.id, stage: 'downloading', progress: p, speed: '6.2MiB/s', eta: '00:02' });
        if (p >= 1) {
          clearInterval(timer);
          resolve({ filePath: `${req.dir}/${req.artist} - ${req.title}.${req.format}`, format: req.format });
        }
      }, 220);
    }, 900);
  });
}
