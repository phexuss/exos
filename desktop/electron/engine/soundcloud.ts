/**
 * SoundCloud without yt-dlp.
 *
 * yt-dlp spends seconds per SoundCloud track: it starts a Python runtime and
 * asks the API for every transcoding in turn. We need one playable stream, so
 * we ask SoundCloud's web API directly: resolve the page URL, pick the best
 * transcoding the player can play, and fetch its signed URL. Two requests.
 *
 * Progressive (plain HTTP) streams are handed to the loopback proxy as-is.
 * HLS streams whose pieces simply concatenate into a playable file (MP3
 * chunks, or fragmented MP4 with an init segment) are fetched in parallel and
 * joined. Anything else (Opus, encrypted, byte ranges) throws and the caller
 * falls back to yt-dlp.
 */
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { dataDir } from './paths';

const API = 'https://api-v2.soundcloud.com';
export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const SEGMENT_PARALLEL = 8;

function get(url: string, timeoutMs = 60_000): Promise<Response> {
  return fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(timeoutMs) });
}

/* ---------- client_id ---------- */

let clientIdCache: string | null = null;
const idFile = () => path.join(dataDir(), 'soundcloud-client-id');

export function findClientId(js: string): string | null {
  const re = /client_id\s*[:=]\s*"([A-Za-z0-9]{32})"/g;
  const m = re.exec(js);
  return m ? m[1] : null;
}

/** The public web client's id, scraped from soundcloud.com's JS bundles. */
async function scrapeClientId(): Promise<string> {
  const res = await get('https://soundcloud.com/', 20_000).catch((e: Error) => {
    throw new Error(`soundcloud.com не открылся: ${e.message}`);
  });
  if (!res.ok) throw new Error(`soundcloud.com не открылся: HTTP ${res.status}`);
  const html = await res.text();
  const scripts = [...html.matchAll(/<script[^>]+src="(https:\/\/[^"]+\.js)"/g)].map((m) => m[1]);
  // The id lives in one of the last bundles.
  for (const src of scripts.reverse()) {
    try {
      const id = findClientId(await (await get(src, 20_000)).text());
      if (id) return id;
    } catch {}
  }
  throw new Error('не нашёл client_id SoundCloud');
}

let scraping: Promise<string> | null = null;

async function clientId(refresh: boolean): Promise<string> {
  if (!refresh) {
    if (clientIdCache) return clientIdCache;
    const saved = (await fs.readFile(idFile(), 'utf8').catch(() => '')).trim();
    if (saved.length === 32) return (clientIdCache = saved);
  }
  scraping ??= scrapeClientId()
    .then(async (id) => {
      await fs.mkdir(dataDir(), { recursive: true }).catch(() => {});
      await fs.writeFile(idFile(), id).catch(() => {});
      clientIdCache = id;
      return id;
    })
    .finally(() => {
      scraping = null;
    });
  return scraping;
}

/** GET against the API with the client id, re-scraping it once if SoundCloud rotated it (401/403). */
async function apiGet<T>(url: string): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const id = await clientId(attempt === 1);
    const u = new URL(url);
    u.searchParams.set('client_id', id);
    const res = await get(u.toString()).catch((e: Error) => {
      throw new Error(`SoundCloud не ответил: ${e.message}`);
    });
    if ((res.status === 401 || res.status === 403) && attempt === 0) continue;
    if (res.status === 404) throw new Error('трек не найден на SoundCloud');
    if (res.status >= 400) throw new Error(`SoundCloud ответил ${res.status}`);
    return (await res.json()) as T;
  }
  throw new Error('SoundCloud не принял client_id');
}

/* ---------- track → stream ---------- */

export type Transcoding = {
  url: string;
  preset?: string;
  snipped?: boolean;
  format: { protocol?: string; mime_type?: string };
};

type Kind = 'progressive' | 'hls';
type Codec = 'aac' | 'mp3';

export type Stream = { url: string; hls: boolean; ext: 'm4a' | 'mp3' };

export function classify(t: Transcoding): { kind: Kind; codec: Codec } | null {
  const protocol = t.format.protocol ?? '';
  const preset = t.preset ?? '';
  if (protocol.includes('encrypted') || protocol.startsWith('ctr-') || protocol.startsWith('cbc-')) return null;
  let kind: Kind;
  if (protocol === 'progressive' && !t.url.includes('/hls')) kind = 'progressive';
  else if (protocol === 'hls') kind = 'hls';
  else return null;
  const mime = (t.format.mime_type ?? '').toLowerCase();
  let codec: Codec;
  if (mime.includes('mp4a') || mime.includes('audio/mp4') || preset.startsWith('aac')) codec = 'aac';
  else if (mime.includes('mpeg') || preset.startsWith('mp3')) codec = 'mp3';
  // Opus and anything new: let yt-dlp handle it.
  else return null;
  if (preset.startsWith('abr')) return null;
  return { kind, codec };
}

/** Progressive first (plays at once, seeks), AAC before MP3, full before preview. */
function rank(t: Transcoding): number | null {
  const c = classify(t);
  if (!c) return null;
  return (c.kind === 'progressive' ? 4 : 0) + (c.codec === 'aac' ? 2 : 0) + (t.snipped ? 0 : 8);
}

export function pick(list: Transcoding[]): Transcoding | null {
  let best: Transcoding | null = null;
  let bestScore = -1;
  for (const t of list) {
    const r = rank(t);
    if (r !== null && r > bestScore) {
      best = t;
      bestScore = r;
    }
  }
  return best;
}

export async function resolve(pageUrl: string): Promise<Stream> {
  const info = await apiGet<{ media?: { transcodings?: Transcoding[] }; track_authorization?: string }>(
    `${API}/resolve?url=${encodeURIComponent(pageUrl)}`,
  );
  const t = pick(info.media?.transcodings ?? []);
  if (!t) throw new Error('у трека нет подходящего потока');
  const { kind, codec } = classify(t)!;
  const u = new URL(t.url);
  if (info.track_authorization) u.searchParams.set('track_authorization', info.track_authorization);
  const stream = await apiGet<{ url: string }>(u.toString());
  return { url: stream.url, hls: kind === 'hls', ext: codec === 'aac' ? 'm4a' : 'mp3' };
}

/* ---------- HLS → one file ---------- */

export function parsePlaylist(base: string, text: string): { init: string | null; segments: string[] } {
  if (!text.trimStart().startsWith('#EXTM3U')) throw new Error('это не плейлист HLS');
  let init: string | null = null;
  const segments: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('#EXT-X-KEY') && !line.includes('METHOD=NONE')) throw new Error('поток зашифрован');
    if (line.startsWith('#EXT-X-BYTERANGE') || line.startsWith('#EXT-X-STREAM-INF')) throw new Error('такой HLS не склеить');
    if (line.startsWith('#EXT-X-MAP:')) {
      if (line.includes('BYTERANGE')) throw new Error('такой HLS не склеить');
      const uri = /URI="([^"]+)"/.exec(line)?.[1];
      if (!uri) throw new Error('битый EXT-X-MAP');
      init = new URL(uri, base).toString();
    } else if (line && !line.startsWith('#')) segments.push(new URL(line, base).toString());
  }
  if (!segments.length) throw new Error('пустой плейлист');
  return { init, segments };
}

async function fetchBytes(url: string, signal?: AbortSignal): Promise<Uint8Array> {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: signal ?? AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`кусок потока не скачался: HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

/**
 * Fetches every piece, `SEGMENT_PARALLEL` at a time, and writes them in
 * order. `onProgress` gets the fraction of pieces done.
 */
export async function fetchHls(url: string, ext: string, dest: string, onProgress: (f: number) => void, signal?: AbortSignal) {
  const res = await get(url).catch((e: Error) => {
    throw new Error(`плейлист не скачался: ${e.message}`);
  });
  if (!res.ok) throw new Error(`плейлист не скачался: HTTP ${res.status}`);
  const playlist = parsePlaylist(url, await res.text());
  // AAC in MPEG-TS pieces doesn't play as one file; yt-dlp + ffmpeg handle it.
  if (ext === 'm4a' && !playlist.init) throw new Error('HLS без init-сегмента');
  const urls = [...(playlist.init ? [playlist.init] : []), ...playlist.segments];
  const tmp = `${dest}.part`;
  const file = createWriteStream(tmp);
  const pending: Promise<Uint8Array>[] = [];
  let next = 0;
  const fill = () => {
    while (pending.length < SEGMENT_PARALLEL && next < urls.length) {
      const p = fetchBytes(urls[next++], signal);
      p.catch(() => {}); // awaited in order below
      pending.push(p);
    }
  };
  try {
    fill();
    for (let done = 1; pending.length; done += 1) {
      const bytes = await pending.shift()!;
      fill();
      if (!file.write(bytes)) await new Promise<void>((r) => file.once('drain', () => r()));
      onProgress(done / urls.length);
    }
    await new Promise<void>((resolve, reject) => file.end((e?: Error | null) => (e ? reject(e) : resolve())));
  } catch (e) {
    file.destroy();
    await fs.rm(tmp, { force: true });
    throw e;
  }
  await fs.rename(tmp, dest);
}

/** Downloads a progressive stream to `dest`, reporting the fraction done. */
export async function fetchProgressive(url: string, dest: string, onProgress: (f: number) => void, signal?: AbortSignal) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal });
  if (!res.ok || !res.body) throw new Error(`поток не скачался: HTTP ${res.status}`);
  const total = Number(res.headers.get('content-length') ?? 0);
  const tmp = `${dest}.part`;
  const file = createWriteStream(tmp);
  let done = 0;
  try {
    for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
      if (!file.write(chunk)) await new Promise<void>((r) => file.once('drain', () => r()));
      done += chunk.length;
      if (total > 0) onProgress(done / total);
    }
    await new Promise<void>((resolve, reject) => file.end((e?: Error | null) => (e ? reject(e) : resolve())));
  } catch (e) {
    file.destroy();
    await fs.rm(tmp, { force: true });
    throw new Error(`обрыв: ${(e as Error).message}`);
  }
  await fs.rename(tmp, dest);
}

/** Headers the proxy sends when it forwards a progressive stream. */
export const proxyHeaders = (): Record<string, string> => ({ 'User-Agent': UA });
