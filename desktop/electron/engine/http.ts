/**
 * API requests for the window, with a disk cache for catalogue answers.
 *
 * The window can't call exos-api directly (its CORS list only has the
 * website), and parsing and caching responses here keeps that work off the
 * UI thread. A GET marked with `ttl` is answered from disk while younger than
 * that, and from disk regardless when the network or the server fails, so
 * screens a user has seen open offline.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { apiCacheDir } from './paths';

export type HttpRequest = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  /** Seconds a cached answer stays fresh; GET only. */
  ttl?: number;
};
export type HttpResponse = { status: number; body: string; cached?: 'fresh' | 'stale' };

type Entry = { at: number; status: number; body: string };

const fileFor = (url: string) => path.join(apiCacheDir(), `${createHash('sha1').update(url).digest('hex')}.json`);

async function readEntry(url: string): Promise<Entry | null> {
  try {
    return JSON.parse(await fs.readFile(fileFor(url), 'utf8')) as Entry;
  } catch {
    return null;
  }
}

async function writeEntry(url: string, entry: Entry) {
  try {
    await fs.mkdir(apiCacheDir(), { recursive: true });
    const file = fileFor(url);
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(entry));
    await fs.rename(tmp, file);
  } catch {}
}

/** Same URL asked twice at once (a hover prefetch and the click) shares one request. */
const inFlight = new Map<string, Promise<HttpResponse>>();

export async function request(req: HttpRequest): Promise<HttpResponse> {
  if (!/^https?:\/\//.test(req.url)) throw new Error('bad url');
  const method = (req.method ?? 'GET').toUpperCase();
  const cacheable = method === 'GET' && !!req.ttl;
  if (cacheable) {
    const hit = await readEntry(req.url);
    if (hit && Date.now() - hit.at < req.ttl! * 1000) return { status: hit.status, body: hit.body, cached: 'fresh' };
  }
  const key = method === 'GET' ? `${req.url}\n${req.headers?.Authorization ?? ''}` : null;
  const running = key ? inFlight.get(key) : undefined;
  if (running) return running;

  const run = (async (): Promise<HttpResponse> => {
    try {
      const res = await fetch(req.url, {
        method,
        headers: req.headers,
        body: req.body,
        signal: AbortSignal.timeout(30_000),
      });
      const body = await res.text();
      if (cacheable && res.ok) await writeEntry(req.url, { at: Date.now(), status: res.status, body });
      if (cacheable && res.status >= 500) {
        const stale = await readEntry(req.url);
        if (stale) return { status: stale.status, body: stale.body, cached: 'stale' };
      }
      return { status: res.status, body };
    } catch (e) {
      if (cacheable) {
        const stale = await readEntry(req.url);
        if (stale) return { status: stale.status, body: stale.body, cached: 'stale' };
      }
      throw new Error(`нет связи с сервером: ${(e as Error).message}`);
    }
  })();
  if (key) inFlight.set(key, run);
  try {
    return await run;
  } finally {
    if (key) inFlight.delete(key);
  }
}
