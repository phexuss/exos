/**
 * Resolving and downloading audio with yt-dlp on this computer, so YouTube
 * and SoundCloud see the user's own IP instead of the EXØS server's.
 *
 * Source and format choice mirror apps/api/src/download/download.service.ts
 * so a track resolves to the same upload on the phone and on the desktop.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { emit } from './bus';
import * as cookies from './cookies';
import * as media from './media';
import { streamCacheDir, workDir } from './paths';
import { lastErrorLine, output, start } from './proc';
import * as soundcloud from './soundcloud';
import * as tools from './tools';

/** YouTube's JS challenge alone can take 10-20 s; give the whole run room. */
const RESOLVE_TIMEOUT = 90_000;
const PROGRESS_MARK = 'EXOSPROG';
const FILE_MARK = 'EXOSFILE';
const CANCELLED = 'отменено';

export type SourceRequest = { query: string; isrc?: string; cookiesBrowser?: string };
export type DownloadRequest = SourceRequest & {
  id: string;
  title: string;
  artist: string;
  album?: string;
  format: string;
  dir: string;
};
export type ResolvedStream = { url: string; protocol: string; ext: string; sourceUrl?: string };
type Stage = 'resolving' | 'downloading' | 'converting' | 'done';

/** Running downloads by track id, so they can be cancelled. */
const jobs = new Map<string, AbortController>();

const isHttp = (s: string) => s.startsWith('http://') || s.startsWith('https://');

function hostOf(u: string): string {
  try {
    return new URL(u).hostname.toLowerCase();
  } catch {
    return '';
  }
}

const isSoundcloud = (u: string) => {
  const h = hostOf(u);
  return h === 'soundcloud.com' || h.endsWith('.soundcloud.com');
};
const isYoutube = (u: string) => {
  const h = hostOf(u);
  return h === 'youtube.com' || h.endsWith('.youtube.com') || h === 'youtu.be';
};

export function resolveSource(req: SourceRequest): string {
  const q = req.query.trim();
  if (isHttp(q)) {
    if (isSoundcloud(q) || isYoutube(q)) return q;
    throw new Error('поддерживаются только ссылки SoundCloud и YouTube');
  }
  const isrc = req.isrc?.trim();
  if (isrc && isrc.length === 12) return `ytsearch1:${isrc}`;
  if (!q) throw new Error('пустой запрос');
  return `ytsearch1:${q}`;
}

/** What to fetch for listening: something Chromium can play directly. */
function streamFormat(source: string): string {
  return isSoundcloud(source)
    ? // Progressive mp3 is gone for most tracks; HLS AAC is next best.
      'http_mp3_128_url/bestaudio[protocol^=http][ext=mp3]/bestaudio[protocol^=http]/bestaudio[acodec^=mp4a]/bestaudio[ext=m4a]/bestaudio'
    : 'bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio[protocol^=http]/bestaudio';
}

async function ctx() {
  const [y, f] = await Promise.all([tools.ytdlp(), tools.ffmpeg()]);
  if (!y) throw new Error('yt-dlp не установлен. Поставь его в Настройках');
  return { ytdlp: y.path, ffmpeg: f?.path ?? null };
}

/** No user config, our JS runtime, our ffmpeg, cookies. `cleanup` deletes the cookie copy. */
async function baseArgs(c: { ffmpeg: string | null }, req: SourceRequest, source: string) {
  const args = [
    '--ignore-config',
    '--no-playlist',
    '--no-warnings',
    '--extractor-retries',
    '2',
    '--socket-timeout',
    '20',
    // HLS (SoundCloud) and DASH arrive in small pieces; fetch several at once.
    '--concurrent-fragments',
    '4',
  ];
  const js = await tools.jsRuntime();
  if (js) args.push('--js-runtimes', `${js.name}:${js.path}`);
  if (c.ffmpeg) args.push('--ffmpeg-location', c.ffmpeg);
  let copy: string | null = null;
  if (req.cookiesBrowser && (isYoutube(source) || source.startsWith('ytsearch'))) {
    copy = await cookies.forRun(req.cookiesBrowser);
    if (copy) args.push('--cookies', copy);
  }
  return { args, cleanup: () => (copy ? fs.rm(copy, { force: true }).catch(() => {}) : undefined) };
}

function friendly(err: string): string {
  const lower = err.toLowerCase();
  if (lower.includes('sign in to confirm') || lower.includes('not a bot'))
    return 'YouTube просит подтвердить, что ты не бот. Выбери браузер в Настройках → Куки браузера для YouTube';
  if (lower.includes('could not copy') && lower.includes('cookie'))
    return 'Не получилось прочитать куки браузера. Закрой браузер и попробуй снова';
  if (lower.includes('requested format is not available') || lower.includes('only images are available'))
    return 'YouTube не отдал аудио. Проверь, что стоит JS-движок (Настройки), и обнови yt-dlp';
  if (lower.includes('ffmpeg') && lower.includes('not found')) return 'Для этого трека нужен ffmpeg. Поставь его в Настройках';
  return err;
}

const hashed = (id: string) => createHash('sha256').update(id).digest('hex').slice(0, 20);

async function remux(ffmpeg: string, input: string, out: string): Promise<void> {
  const args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-map', '0:a', '-c', 'copy'];
  if (out.endsWith('.m4a')) args.push('-movflags', '+faststart');
  args.push(out);
  try {
    await output(ffmpeg, args, 60_000);
  } catch (e) {
    await fs.rm(out, { force: true });
    throw e;
  }
}

/** SoundCloud straight from its API: a proxied URL for progressive streams, a cached file for HLS. */
async function soundcloudStream(page: string): Promise<ResolvedStream> {
  const stream = await soundcloud.resolve(page);
  if (!stream.hls) {
    const url = media.remoteUrl(stream.url, soundcloud.proxyHeaders(), stream.ext);
    return { url, protocol: 'https', ext: stream.ext };
  }
  const dir = streamCacheDir();
  await fs.mkdir(dir, { recursive: true });
  const dest = path.join(dir, `${hashed(`sc2|${page}`)}.${stream.ext}`);
  if (!(await exists(dest))) {
    const raw = dest.replace(/\.(\w+)$/, '.part.$1');
    await soundcloud.fetchHls(stream.url, stream.ext, raw, () => {});
    // Glued-together HLS segments carry no length index, so players guess the
    // duration from the first chunk and seek badly. A copy through ffmpeg
    // writes a proper header; without ffmpeg the raw file still plays.
    const ff = await tools.ffmpeg();
    const ok = ff ? await remux(ff.path, raw, dest).then(() => true, () => false) : false;
    if (ok) await fs.rm(raw, { force: true });
    else await fs.rename(raw, dest);
  }
  return { url: await media.fileUrl(dest), protocol: 'file', ext: stream.ext };
}

const exists = (p: string) => fs.stat(p).then((s) => s.isFile(), () => false);

export async function resolveStream(req: SourceRequest): Promise<ResolvedStream> {
  const source = resolveSource(req);
  if (isSoundcloud(source)) {
    try {
      return await soundcloudStream(source);
    } catch (e) {
      console.error(`soundcloud: ${(e as Error).message}; falling back to yt-dlp`);
    }
  }
  const c = await ctx();
  const base = await baseArgs(c, req, source);
  let out: string;
  try {
    out = await output(
      c.ytdlp,
      [...base.args, '-f', streamFormat(source), '--print', '%(protocol)s\t%(ext)s\t%(http_headers)j\t%(webpage_url)s\t%(url)s', source],
      RESOLVE_TIMEOUT,
    );
  } catch (e) {
    throw new Error(friendly((e as Error).message));
  } finally {
    await base.cleanup();
  }
  const line = out
    .split(/\r?\n/)
    .reverse()
    .find((l) => l.includes('\thttp'));
  if (!line) throw new Error('yt-dlp не вернул ссылку');
  const [protocol = '', ext = '', headersJson = '{}', page = '', ...rest] = line.split('\t');
  const url = rest.join('\t').trim();
  if (!isHttp(url)) throw new Error('yt-dlp вернул странную ссылку');
  let headers: Record<string, string> = {};
  try {
    headers = JSON.parse(headersJson) as Record<string, string>;
  } catch {}
  const sourceUrl = isYoutube(page.trim()) || isSoundcloud(page.trim()) ? page.trim() : undefined;
  if (protocol.startsWith('http')) {
    // The CDN may insist on yt-dlp's headers, which <audio> can't send; the
    // loopback server forwards them.
    return { url: media.remoteUrl(url, headers, ext), protocol, ext, sourceUrl };
  }
  return { url, protocol, ext, sourceUrl };
}

/** Strips characters Windows, macOS or Linux refuse in file names. */
export function safeName(s: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are what we strip
  const cleaned = s.replace(/[/\\:*?"<>|\u0000-\u001f\u007f]/g, '_');
  const trimmed = cleaned.trim().replace(/\.+$/, '').trim();
  return Array.from(trimmed).slice(0, 150).join('') || 'track';
}

/**
 * A `--parse-metadata` FROM that evaluates to `s` literally. FROM is split on
 * `:` and is a template (so `%` needs doubling), and a bare word would be read
 * as a field name, hence the empty-default field in front.
 */
export const templateLiteral = (s: string) => `%(exos_none|)s${s.replaceAll('%', '%%').replaceAll(':', '\\:')}`;

function progress(id: string, stage: Stage, value: number, speed?: string, eta?: string) {
  emit('download://progress', { id, stage, progress: value, speed, eta });
}

/** Runs yt-dlp into a scratch folder, reporting progress, and returns the finished file. */
async function runDownload(id: string, args: string[], scratch: string, signal: AbortSignal, converts: boolean): Promise<string> {
  const { ytdlp } = await ctx();
  await fs.mkdir(scratch, { recursive: true });
  args.push(
    // YouTube throttles long single requests; ask in 10 MB pieces.
    '--http-chunk-size',
    '10M',
    '--newline',
    '--progress',
    '--progress-template',
    `download:${PROGRESS_MARK}\t%(progress._percent_str)s\t%(progress._speed_str)s\t%(progress._eta_str)s`,
    '--print',
    `after_move:${FILE_MARK}\t%(filepath)s`,
    '-P',
    scratch,
  );
  progress(id, 'resolving', 0);
  const child = start(ytdlp, args);
  const kill = () => child.kill();
  signal.addEventListener('abort', kill);
  let log = '';
  child.stderr?.on('data', (b: Buffer) => {
    log += b.toString('utf8');
    if (log.length > 64_000) log = log.slice(-32_000);
  });
  let file: string | null = null;
  const clean = (s: string | undefined) => {
    const v = s?.trim();
    return v && v !== 'Unknown' && v !== 'N/A' ? v : undefined;
  };
  const lines = readline.createInterface({ input: child.stdout! });
  lines.on('line', (line) => {
    if (line.startsWith(`${PROGRESS_MARK}\t`)) {
      const [, pct, speed, eta] = line.split('\t');
      const p = (Number.parseFloat((pct ?? '').trim().replace('%', '')) || 0) / 100;
      if (p >= 1 && converts) progress(id, 'converting', 1);
      else progress(id, 'downloading', Math.min(1, p), clean(speed), clean(eta));
    } else if (line.startsWith(`${FILE_MARK}\t`)) file = line.slice(FILE_MARK.length + 1).trim();
  });
  const code = await new Promise<number | null>((resolve) => {
    child.on('error', (e) => {
      log += `\nERROR: не удалось запустить yt-dlp: ${e.message}`;
      resolve(-1);
    });
    child.on('close', resolve);
  });
  signal.removeEventListener('abort', kill);
  if (signal.aborted) throw new Error(CANCELLED);
  if (code !== 0) throw new Error(friendly(lastErrorLine(log)));
  if (!file || !(await exists(file))) throw new Error(friendly(`yt-dlp закончил без файла. ${lastErrorLine(log)}`));
  return file;
}

function register(id: string): AbortController {
  const ctl = new AbortController();
  jobs.set(id, ctl);
  return ctl;
}

export function cancel(id: string) {
  jobs.get(id)?.abort();
  jobs.delete(id);
}

async function moveFile(from: string, to: string) {
  try {
    await fs.rename(from, to);
  } catch {
    // Different drive: copy, then remove.
    await fs.copyFile(from, to).catch((e: Error) => {
      throw new Error(`не удалось сохранить файл: ${e.message}`);
    });
    await fs.rm(from, { force: true });
  }
}

/** Downloads a track for listening only (HLS sources, refused direct URLs). */
export async function cacheTrack(id: string, req: SourceRequest): Promise<string> {
  const dir = streamCacheDir();
  const key = hashed(`${id}|${req.query}`);
  const hit = (await fs.readdir(dir).catch(() => [] as string[])).find((n) => n.startsWith(`${key}.`) && !n.includes('.part'));
  if (hit) return path.join(dir, hit);
  const c = await ctx();
  const source = resolveSource(req);
  const base = await baseArgs(c, req, source);
  const scratch = path.join(workDir(), `cache-${key}`);
  const cacheId = `cache:${id}`;
  const ctl = register(cacheId);
  try {
    const file = await runDownload(cacheId, [...base.args, '-f', streamFormat(source), '-o', `${key}.%(ext)s`, source], scratch, ctl.signal, false);
    await fs.mkdir(dir, { recursive: true });
    const dest = path.join(dir, path.basename(file));
    await moveFile(file, dest);
    return dest;
  } finally {
    jobs.delete(cacheId);
    await base.cleanup();
    await fs.rm(scratch, { recursive: true, force: true });
  }
}

async function freePath(dir: string, stem: string, ext: string): Promise<string> {
  const first = path.join(dir, `${stem}.${ext}`);
  if (!(await fs.stat(first).catch(() => null))) return first;
  for (let n = 2; n < 1000; n += 1) {
    const p = path.join(dir, `${stem} (${n}).${ext}`);
    if (!(await fs.stat(p).catch(() => null))) return p;
  }
  return first;
}

/** Tags (and if asked, re-encodes) a file with ffmpeg, writing `out`. */
async function ffmpegFinish(ffmpeg: string, input: string, out: string, req: DownloadRequest, toMp3: boolean) {
  const args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-map', '0:a', '-map_metadata', '-1'];
  args.push(...(toMp3 ? ['-c:a', 'libmp3lame', '-q:a', '0'] : ['-c:a', 'copy']));
  for (const [key, value] of [
    ['title', req.title],
    ['artist', req.artist],
    ['album', req.album],
  ] as const) {
    if (value?.trim()) args.push('-metadata', `${key}=${value}`);
  }
  if (out.endsWith('.m4a')) args.push('-movflags', '+faststart');
  args.push(out);
  await output(ffmpeg, args, 300_000);
}

/** SoundCloud download straight from its API; the caller falls back to yt-dlp on error. */
async function soundcloudDownload(req: DownloadRequest, page: string, ffmpeg: string | null, scratch: string, signal: AbortSignal) {
  progress(req.id, 'resolving', 0);
  const stream = await soundcloud.resolve(page);
  await fs.mkdir(scratch, { recursive: true });
  const raw = path.join(scratch, `raw.${stream.ext}`);
  const onProgress = (f: number) => progress(req.id, 'downloading', Math.min(1, f));
  if (stream.hls) await soundcloud.fetchHls(stream.url, stream.ext, raw, onProgress, signal);
  else await soundcloud.fetchProgressive(stream.url, raw, onProgress, signal);
  if (signal.aborted) throw new Error(CANCELLED);
  if (!ffmpeg) return raw;
  const toMp3 = req.format === 'mp3' && stream.ext !== 'mp3';
  const out = path.join(scratch, `track.${toMp3 ? 'mp3' : stream.ext}`);
  progress(req.id, 'converting', 1);
  try {
    await ffmpegFinish(ffmpeg, raw, out, req, toMp3);
    return out;
  } catch (e) {
    // Untagged is better than nothing.
    if (!toMp3) {
      console.error(`ffmpeg tagging failed: ${(e as Error).message}`);
      return raw;
    }
    throw e;
  }
}

/** Moves a finished file into the music folder as "Artist - Title.ext". */
async function finishDownload(req: DownloadRequest, file: string) {
  await fs.mkdir(req.dir, { recursive: true }).catch((e: Error) => {
    throw new Error(`не удалось создать папку ${req.dir}: ${e.message}`);
  });
  const ext = path.extname(file).slice(1) || 'm4a';
  const dest = await freePath(req.dir, safeName(`${req.artist} - ${req.title}`), ext);
  await moveFile(file, dest);
  progress(req.id, 'done', 1);
  return { filePath: dest, format: ext };
}

export async function downloadTrack(req: DownloadRequest): Promise<{ filePath: string; format: string }> {
  const c = await ctx();
  const source = resolveSource(req);
  const sc = isSoundcloud(source);
  if (sc) {
    const scratch = path.join(workDir(), `sc-${hashed(req.id)}`);
    await fs.rm(scratch, { recursive: true, force: true });
    const ctl = register(req.id);
    try {
      const file = await soundcloudDownload(req, source, c.ffmpeg, scratch, ctl.signal);
      return await finishDownload(req, file);
    } catch (e) {
      if (ctl.signal.aborted) throw new Error(CANCELLED);
      console.error(`soundcloud: ${(e as Error).message}; falling back to yt-dlp`);
    } finally {
      jobs.delete(req.id);
      await fs.rm(scratch, { recursive: true, force: true });
    }
  }
  const hasFfmpeg = !!c.ffmpeg;
  const wantMp3 = req.format === 'mp3';
  if (wantMp3 && !hasFfmpeg && !sc) throw new Error('Для MP3 нужен ffmpeg. Поставь его в Настройках или выбери M4A');

  const base = await baseArgs(c, req, source);
  const args = [...base.args];
  const format = sc
    ? streamFormat(source)
    : hasFfmpeg
      ? 'bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio'
      : // No ffmpeg: take a single file that already plays everywhere.
        'bestaudio[ext=m4a]/bestaudio[acodec^=mp4a][protocol^=http]/bestaudio[protocol^=http]';
  args.push('-f', format, '-o', 'track.%(ext)s');
  let converts = false;
  if (hasFfmpeg) {
    // Copies AAC as-is into m4a; re-encodes only when the source differs.
    const target = wantMp3 || sc ? 'mp3' : 'm4a';
    args.push('-x', '--audio-format', target);
    if (target === 'mp3') args.push('--audio-quality', '0');
    converts = true;
    // Tag the file with the Deezer/SoundCloud metadata, not YouTube's video title.
    args.push('--embed-metadata');
    for (const [value, field] of [
      [req.title, 'meta_title'],
      [req.artist, 'meta_artist'],
      [req.album, 'meta_album'],
    ] as const) {
      if (value?.trim()) args.push('--parse-metadata', `${templateLiteral(value)}:%(${field})s`);
    }
    for (const field of ['meta_description', 'meta_synopsis', 'meta_comment', 'meta_purl']) {
      args.push('--parse-metadata', `:(?P<${field}>)`);
    }
  }
  args.push(source);

  const scratch = path.join(workDir(), hashed(req.id));
  await fs.rm(scratch, { recursive: true, force: true });
  const ctl = register(req.id);
  try {
    const file = await runDownload(req.id, args, scratch, ctl.signal, converts);
    return await finishDownload(req, file);
  } finally {
    jobs.delete(req.id);
    await base.cleanup();
    await fs.rm(scratch, { recursive: true, force: true });
  }
}
