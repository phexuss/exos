/**
 * A small HTTP server on 127.0.0.1 that feeds the window.
 *
 * - Audio: local files with Range support, and CDN streams proxied with the
 *   headers yt-dlp used (an <audio> element can't send them). googlevideo
 *   refuses the open-ended `Range: bytes=N-` every player sends, so upstream
 *   is always asked in closed 10 MiB pieces and stitched back together.
 * - Cover art: fetched once, kept on disk, served from there afterwards, so
 *   screens draw instantly and work offline.
 *
 * Every URL carries a random per-launch secret, and audio URLs a token we
 * handed out ourselves, so nothing else on the machine can read files here.
 */
import { createHash, randomBytes } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { imageCacheDir } from './paths';

const AUDIO_EXTS = ['m4a', 'mp3', 'mp4', 'aac', 'opus', 'ogg', 'oga', 'webm', 'flac', 'wav'];
/** Upstream requests ask for at most this much at a time. */
export const CHUNK = Number(process.env.EXOS_PROXY_CHUNK) || 10 << 20;

type Source = { kind: 'file'; path: string } | { kind: 'remote'; url: string; headers: Record<string, string>; ext: string };

const secret = randomBytes(16).toString('hex');
const tokens = new Map<string, Source>();
let base = '';
let server: http.Server | null = null;

export function mediaBase(): string {
  return base;
}

export function stop() {
  server?.close();
  server?.closeAllConnections();
}

export function start(): Promise<string> {
  const srv = http.createServer((req, res) => {
    serve(req, res).catch((e) => {
      console.error(`media: ${(e as Error).message}`);
      if (!res.headersSent) res.writeHead(500).end();
      else res.destroy();
    });
  });
  srv.keepAliveTimeout = 30_000;
  server = srv;
  return new Promise((resolve, reject) => {
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      if (!addr || typeof addr === 'string') return reject(new Error('no port'));
      base = `http://127.0.0.1:${addr.port}/${secret}`;
      resolve(base);
    });
  });
}

function register(source: Source): string {
  if (!base) throw new Error('плеер ещё не готов');
  // Keep the map from growing forever over a long session.
  if (tokens.size > 500) tokens.clear();
  const token = randomBytes(12).toString('hex');
  tokens.set(token, source);
  return `${base}/${token}`;
}

const extOf = (p: string) => path.extname(p).slice(1).toLowerCase();

/** A URL the player can load for a file on disk. */
export async function fileUrl(p: string): Promise<string> {
  if (!AUDIO_EXTS.includes(extOf(p))) throw new Error('это не аудиофайл');
  const st = await fs.stat(p).catch(() => null);
  if (!st?.isFile()) throw new Error('файл не найден');
  return register({ kind: 'file', path: p });
}

/** A URL the player can load for a CDN link, sent with yt-dlp's headers. */
export function remoteUrl(url: string, headers: Record<string, string>, ext: string): string {
  return register({ kind: 'remote', url, headers, ext });
}

function mime(ext: string): string {
  switch (ext) {
    case 'm4a':
    case 'mp4':
      return 'audio/mp4';
    case 'mp3':
      return 'audio/mpeg';
    case 'aac':
      return 'audio/aac';
    case 'opus':
    case 'ogg':
    case 'oga':
      return 'audio/ogg';
    case 'webm':
      return 'audio/webm';
    case 'flac':
      return 'audio/flac';
    case 'wav':
      return 'audio/wav';
    default:
      return 'application/octet-stream';
  }
}

type Range = { from: number | null; to: number | null } | null;

function parseRange(h: string | undefined): Range {
  const m = /^bytes=(\d*)-(\d*)/.exec(h ?? '');
  if (!m) return null;
  return { from: m[1] ? Number(m[1]) : null, to: m[2] ? Number(m[2]) : null };
}

async function serve(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://x');
  const parts = url.pathname.split('/').filter(Boolean);
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (parts[0] !== secret || parts.length !== 2) return void res.writeHead(400, { 'Content-Length': 0 }).end();
  if (parts[1] === 'img') return serveImage(req, res, url.searchParams.get('u') ?? '');
  const source = tokens.get(parts[1]);
  if (!source) return void res.writeHead(404, { 'Content-Length': 0 }).end();
  const range = parseRange(req.headers.range);
  if (source.kind === 'file') return serveFile(req, res, source.path, range);
  return serveRemote(req, res, source, range);
}

async function serveFile(req: http.IncomingMessage, res: http.ServerResponse, p: string, range: Range) {
  const st = await fs.stat(p).catch(() => null);
  if (!st) return void res.writeHead(404, { 'Content-Length': 0 }).end();
  const len = st.size;
  const headers: Record<string, string | number> = { 'Content-Type': mime(extOf(p)), 'Accept-Ranges': 'bytes' };
  let start = 0;
  let end = len - 1;
  let status = 200;
  if (range && (range.from !== null || range.to !== null)) {
    status = 206;
    if (range.from === null) start = Math.max(0, len - (range.to ?? 0));
    else {
      start = range.from;
      end = Math.min(range.to ?? len - 1, len - 1);
    }
  }
  if (len === 0 || start > end || start >= len) {
    return void res.writeHead(416, { ...headers, 'Content-Range': `bytes */${len}`, 'Content-Length': 0 }).end();
  }
  if (status === 206) headers['Content-Range'] = `bytes ${start}-${end}/${len}`;
  headers['Content-Length'] = end - start + 1;
  res.writeHead(status, headers);
  if (req.method === 'HEAD') return void res.end();
  const stream = createReadStream(p, { start, end });
  res.on('close', () => stream.destroy());
  stream.pipe(res);
}

/** Just the host, for logs; the rest of a CDN URL is a signature. */
const hostOf = (u: string) => {
  try {
    return new URL(u).host;
  } catch {
    return '?';
  }
};

function upstream(src: { url: string; headers: Record<string, string> }, range: string, method: string, signal: AbortSignal) {
  return fetch(src.url, { method, headers: { ...src.headers, Range: range }, signal }).catch((e: Error) => {
    if (!signal.aborted) console.error(`media: upstream request failed (${hostOf(src.url)}): ${e.message}`);
    return null;
  });
}

/** "bytes 0-999/5000" → [0, 999, 5000]. */
function contentRange(r: Response): [number, number, number] | null {
  const m = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(r.headers.get('content-range') ?? '');
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** Copies a body into the response; resolves with the bytes sent. */
async function pipe(body: ReadableStream<Uint8Array> | null, res: http.ServerResponse): Promise<number> {
  if (!body) return 0;
  let sent = 0;
  try {
    for await (const chunk of body as unknown as AsyncIterable<Uint8Array>) {
      if (res.destroyed) break;
      if (!res.write(chunk)) await new Promise((r) => res.once('drain', r).once('close', r));
      sent += chunk.length;
    }
  } catch {}
  return sent;
}

async function serveRemote(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  src: Extract<Source, { kind: 'remote' }>,
  range: Range,
) {
  const abort = new AbortController();
  res.on('close', () => abort.abort());
  const head = req.method === 'HEAD';
  // CDNs label audio-only MP4 as video/mp4; say what it is so the decoder doesn't hesitate.
  const out: Record<string, string | number> = { 'Content-Type': mime(src.ext), 'Accept-Ranges': 'bytes' };
  if (range && range.from === null && range.to !== null) {
    // A suffix range needs the length first; rare enough to pass through.
    const r = await upstream(src, `bytes=-${range.to}`, head ? 'HEAD' : 'GET', abort.signal);
    if (!r || r.status >= 400) return void res.writeHead(r?.status === 416 ? 416 : 502, { 'Content-Length': 0 }).end();
    for (const h of ['content-length', 'content-range']) {
      const v = r.headers.get(h);
      if (v) out[h] = v;
    }
    res.writeHead(r.status === 206 ? 206 : 200, out);
    if (!head) await pipe(r.body, res);
    return void res.end();
  }
  const from = range?.from ?? 0;
  const to = range?.to ?? null;
  const firstEnd = Math.min(to ?? Number.MAX_SAFE_INTEGER, from + CHUNK - 1);
  const first = await upstream(src, `bytes=${from}-${firstEnd}`, head ? 'HEAD' : 'GET', abort.signal);
  if (!first) return void res.writeHead(502, { 'Content-Length': 0 }).end();
  if (first.status >= 400) {
    console.error(`media: upstream answered ${first.status} (${head ? 'HEAD' : 'GET'} ${hostOf(src.url)}, bytes=${from}-${firstEnd})`);
    void first.body?.cancel();
    return void res.writeHead(first.status === 416 ? 416 : 502, { 'Content-Length': 0 }).end();
  }
  const cr = first.status === 206 ? contentRange(first) : null;
  if (!cr) {
    // The server ignored Range and sends the whole file: hand it over as is.
    const len = first.headers.get('content-length');
    if (len) out['Content-Length'] = len;
    res.writeHead(200, out);
    if (!head) await pipe(first.body, res);
    return void res.end();
  }
  const [, gotEnd, total] = cr;
  const end = Math.min(to ?? total - 1, total - 1);
  out['Content-Length'] = end + 1 - from;
  let status = 200;
  if (range) {
    out['Content-Range'] = `bytes ${from}-${end}/${total}`;
    status = 206;
  }
  res.writeHead(status, out);
  if (head) {
    void first.body?.cancel();
    return void res.end();
  }
  let pos = from + (await pipe(first.body, res));
  // Cut short: end here; the player asks again from where it stopped.
  if (pos !== gotEnd + 1) return void res.end();
  while (pos <= end && !res.destroyed) {
    const stop = Math.min(end, pos + CHUNK - 1);
    const r = await upstream(src, `bytes=${pos}-${stop}`, 'GET', abort.signal);
    if (!r) break;
    if (r.status !== 206) {
      console.error(`media: upstream answered ${r.status} mid-stream (${hostOf(src.url)}, bytes=${pos}-${stop})`);
      void r.body?.cancel();
      break;
    }
    const sent = await pipe(r.body, res);
    if (sent === 0) break;
    pos += sent;
  }
  res.end();
}

/* ---------- cover art ---------- */

/** Covers in flight, so a grid asking for the same picture twice fetches it once. */
const imageJobs = new Map<string, Promise<string | null>>();

function imagePath(u: string): string {
  return path.join(imageCacheDir(), createHash('sha1').update(u).digest('hex'));
}

async function fetchImage(u: string, dest: string): Promise<string | null> {
  const res = await fetch(u, { signal: AbortSignal.timeout(20_000) }).catch(() => null);
  const type = res?.headers.get('content-type') ?? '';
  if (!res?.ok || !type.startsWith('image/')) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.${process.pid}.part`;
  await fs.writeFile(tmp, bytes);
  await fs.writeFile(`${dest}.type`, type);
  await fs.rename(tmp, dest);
  return type;
}

async function serveImage(req: http.IncomingMessage, res: http.ServerResponse, u: string) {
  if (!/^https:\/\//.test(u)) return void res.writeHead(400, { 'Content-Length': 0 }).end();
  const dest = imagePath(u);
  let type = await fs.readFile(`${dest}.type`, 'utf8').catch(() => null);
  if (!type || !(await fs.stat(dest).catch(() => null))) {
    let job = imageJobs.get(u);
    if (!job) {
      job = fetchImage(u, dest).finally(() => imageJobs.delete(u));
      imageJobs.set(u, job);
    }
    type = await job;
    if (!type) return void res.writeHead(502, { 'Content-Length': 0 }).end();
  }
  // Cover URLs never change content; let Chromium keep them in memory too.
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' });
  if (req.method === 'HEAD') return void res.end();
  createReadStream(dest).pipe(res);
}

/** Drops covers nobody has looked at for a month, keeping the folder bounded. */
export async function pruneImages(maxAgeDays = 30): Promise<void> {
  const dir = imageCacheDir();
  const names = await fs.readdir(dir).catch(() => [] as string[]);
  const cutoff = Date.now() - maxAgeDays * 86_400_000;
  for (const name of names) {
    const p = path.join(dir, name);
    const st = await fs.stat(p).catch(() => null);
    if (st && st.atimeMs < cutoff && st.mtimeMs < cutoff) await fs.rm(p, { force: true });
  }
}
