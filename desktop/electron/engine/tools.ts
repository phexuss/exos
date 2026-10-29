/**
 * Finding, installing and updating the tools the local engine runs on:
 * yt-dlp itself, a JavaScript runtime it uses for YouTube's challenges (Deno
 * by default), and ffmpeg for HLS and format conversion.
 */
import { createWriteStream, existsSync, readdirSync, statSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import yauzl from 'yauzl';
import { emit } from './bus';
import { binDir, dataDir, defaultMusicDir, exe } from './paths';
import { output } from './proc';
import { L } from './i18n';

export type ToolInfo = { path: string; version: string; managed: boolean };
export type JsRuntime = ToolInfo & { name: string };
export type EngineStatus = {
  ytdlp: ToolInfo | null;
  ffmpeg: ToolInfo | null;
  jsRuntime: JsRuntime | null;
  musicDir: string;
  dataDir: string;
  installable: { ytdlp: boolean; ffmpeg: boolean; deno: boolean };
};

const VERSION_TIMEOUT = 20_000;
const UA = `EXOS-desktop/${process.env.EXOS_VERSION ?? '0'}`;
const isWin = process.platform === 'win32';

/** GUI apps on macOS start with a bare PATH; Homebrew lives outside it. */
function extraDirs(): string[] {
  const dirs: string[] = [];
  if (process.platform === 'darwin') dirs.push('/opt/homebrew/bin', '/usr/local/bin');
  if (process.platform === 'linux') dirs.push('/usr/local/bin', '/usr/bin');
  const home = os.homedir();
  dirs.push(path.join(home, '.deno/bin'), path.join(home, '.bun/bin'), path.join(home, '.local/bin'));
  return dirs;
}

function isFile(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function which(name: string): string | null {
  const exts = isWin ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';').map((e) => e.toLowerCase()) : [''];
  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const p = path.join(dir, name + ext);
      if (isFile(p)) return p;
    }
  }
  return null;
}

/**
 * Where the unpacked ("onedir") yt-dlp build lives: the executable plus its
 * `_internal` folder. It starts several times faster than the single-file
 * build, which unpacks a whole Python runtime to a temp folder on every run.
 */
const ytdlpDistDir = () => path.join(binDir(), 'yt-dlp-dist');

function ytdlpInDist(dir: string): string | null {
  try {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (name.startsWith('yt-dlp') && (!isWin || name.endsWith('.exe')) && isFile(p)) return p;
    }
  } catch {}
  return null;
}

/** Our own copy first, then PATH, then the usual install locations. */
function locate(name: string): { path: string; managed: boolean } | null {
  if (name === 'yt-dlp') {
    const p = ytdlpInDist(ytdlpDistDir());
    if (p) return { path: p, managed: true };
  }
  const managed = path.join(binDir(), exe(name));
  if (isFile(managed)) return { path: managed, managed: true };
  const found = which(name);
  if (found) return { path: found, managed: false };
  for (const d of extraDirs()) {
    const p = path.join(d, exe(name));
    if (isFile(p)) return { path: p, managed: false };
  }
  return null;
}

/**
 * First version lines by binary path and modification time. Asking a
 * PyInstaller yt-dlp for its version costs a second or more, and every play
 * and download looks the tools up; an update changes the mtime and re-asks.
 */
const versions = new Map<string, { mtime: number; line: string }>();

async function versionOf(p: string, args: string[]): Promise<string | null> {
  let mtime = 0;
  try {
    mtime = statSync(p).mtimeMs;
  } catch {}
  const hit = versions.get(p);
  if (hit && hit.mtime === mtime) return hit.line;
  try {
    const first = (await output(p, args, VERSION_TIMEOUT)).split(/\r?\n/)[0].trim();
    versions.set(p, { mtime, line: first });
    return first;
  } catch {
    return null;
  }
}

export async function ytdlp(): Promise<ToolInfo | null> {
  const found = locate('yt-dlp');
  if (!found) return null;
  const version = await versionOf(found.path, ['--version']);
  return version ? { ...found, version } : null;
}

export async function ffmpeg(): Promise<ToolInfo | null> {
  const found = locate('ffmpeg');
  if (!found) return null;
  const line = await versionOf(found.path, ['-version']);
  if (!line) return null;
  // "ffmpeg version 7.1-full_build-www.gyan.dev Copyright ..."
  const version = (line.split(/\s+/)[2] ?? '?').split(/[-+]/)[0];
  return { ...found, version };
}

export async function jsRuntime(): Promise<JsRuntime | null> {
  for (const name of ['deno', 'node', 'bun']) {
    const found = locate(name);
    if (!found) continue;
    const v = await versionOf(found.path, ['--version']);
    if (!v) continue;
    // deno prints "deno 2.5.4 (stable, ...)", node "v22.1.0", bun "1.2.3".
    const version = v.replace(/^deno /, '').replace(/^v/, '').split(/\s+/)[0] || '?';
    return { name, ...found, version };
  }
  return null;
}

/* ---------- install ---------- */

const arch = process.arch;

/** The unpacked builds; see `ytdlpDistDir`. */
function ytdlpAsset(): string | null {
  if (isWin) return arch === 'arm64' ? 'yt-dlp_win_arm64.zip' : arch === 'ia32' ? 'yt-dlp_win_x86.zip' : 'yt-dlp_win.zip';
  if (process.platform === 'darwin') return 'yt-dlp_macos.zip';
  if (process.platform === 'linux') return arch === 'x64' ? 'yt-dlp_linux.zip' : arch === 'arm64' ? 'yt-dlp_linux_aarch64.zip' : null;
  return null;
}

function denoTarget(): string | null {
  const key = `${process.platform}-${arch}`;
  return (
    {
      'win32-x64': 'x86_64-pc-windows-msvc',
      'darwin-x64': 'x86_64-apple-darwin',
      'darwin-arm64': 'aarch64-apple-darwin',
      'linux-x64': 'x86_64-unknown-linux-gnu',
      'linux-arm64': 'aarch64-unknown-linux-gnu',
    } as Record<string, string>
  )[key] ?? null;
}

/**
 * Static ffmpeg builds come as zips only for Windows (yt-dlp's own
 * FFmpeg-Builds). Elsewhere the system package manager does a better job.
 */
function ffmpegAsset(): string | null {
  if (!isWin) return null;
  return arch === 'arm64' ? 'ffmpeg-master-latest-winarm64-gpl.zip' : 'ffmpeg-master-latest-win64-gpl.zip';
}

export async function status(): Promise<EngineStatus> {
  const [y, f, js] = await Promise.all([ytdlp(), ffmpeg(), jsRuntime()]);
  return {
    ytdlp: y,
    ffmpeg: f,
    jsRuntime: js,
    musicDir: defaultMusicDir(),
    dataDir: dataDir(),
    installable: { ytdlp: !!ytdlpAsset(), deno: !!denoTarget(), ffmpeg: !!ffmpegAsset() },
  };
}

async function downloadTo(tool: string, url: string, dest: string): Promise<void> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(10 * 60_000),
  }).catch((e) => {
    throw new Error(
      L(`не скачалось ${url}: ${(e as Error).message}`, `download failed ${url}: ${(e as Error).message}`),
    );
  });
  if (!res.ok || !res.body)
    throw new Error(L(`не скачалось ${url}: HTTP ${res.status}`, `download failed ${url}: HTTP ${res.status}`));
  const total = Number(res.headers.get('content-length') ?? 0);
  let done = 0;
  let lastEmit = 0;
  const file = createWriteStream(dest);
  try {
    for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
      if (!file.write(chunk)) await new Promise<void>((r) => file.once('drain', () => r()));
      done += chunk.length;
      if (total > 0 && (done - lastEmit) / total > 0.01) {
        lastEmit = done;
        emit('engine://install-progress', { tool, progress: done / total });
      }
    }
  } catch (e) {
    file.destroy();
    throw new Error(L(`обрыв загрузки: ${(e as Error).message}`, `download cut off: ${(e as Error).message}`));
  }
  await new Promise<void>((resolve, reject) => file.end((err?: Error | null) => (err ? reject(err) : resolve())));
}

function openZip(file: string): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) =>
    yauzl.open(file, { lazyEntries: true, autoClose: true }, (err, zip) => (err || !zip ? reject(err) : resolve(zip))),
  );
}

/**
 * Walks a zip. `place` maps an entry name to where it goes on disk (or null to
 * skip it); unix permissions stored in the zip are kept.
 */
async function unzip(file: string, place: (name: string) => string | null, forceExec = false): Promise<number> {
  const zip = await openZip(file);
  let written = 0;
  await new Promise<void>((resolve, reject) => {
    zip.on('error', reject);
    zip.on('end', () => resolve());
    zip.on('entry', (entry: yauzl.Entry) => {
      const dest = place(entry.fileName);
      if (!dest) return zip.readEntry();
      if (entry.fileName.endsWith('/')) {
        fs.mkdir(dest, { recursive: true }).then(() => zip.readEntry(), reject);
        return;
      }
      zip.openReadStream(entry, (err, stream) => {
        if (err || !stream) return reject(err);
        const unixMode = (entry.externalFileAttributes >>> 16) & 0o7777;
        const mode = forceExec ? 0o755 : unixMode || 0o644;
        fs.mkdir(path.dirname(dest), { recursive: true })
          .then(() => pipeline(stream, createWriteStream(dest, { mode })))
          .then(() => (isWin ? undefined : fs.chmod(dest, mode)))
          .then(() => {
            written += 1;
            zip.readEntry();
          }, reject);
      });
    });
    zip.readEntry();
  });
  return written;
}

/** Unpacks a whole archive into `into`, keeping folders and exec bits. */
async function extractAll(zipPath: string, into: string): Promise<void> {
  const root = path.resolve(into);
  await unzip(zipPath, (name) => {
    const dest = path.resolve(root, name);
    return dest === root || dest.startsWith(root + path.sep) ? dest : null;
  });
}

/** Pulls the named entries (matched by file name, any folder) out of a zip. */
async function extract(zipPath: string, wanted: string[], into: string): Promise<void> {
  const n = await unzip(
    zipPath,
    (name) => {
      const base = path.posix.basename(name);
      return !name.endsWith('/') && wanted.includes(base) ? path.join(into, base) : null;
    },
    true,
  );
  if (n === 0) throw new Error(L(`в архиве нет ${wanted.join(', ')}`, `the archive has no ${wanted.join(', ')}`));
}

const stamp = () => path.join(dataDir(), 'ytdlp-updated');

async function installYtdlp(): Promise<void> {
  const bin = binDir();
  const asset = ytdlpAsset();
  if (!asset) throw new Error(L('под эту систему нет готового yt-dlp', 'no yt-dlp build for this system'));
  const tmp = path.join(bin, 'yt-dlp.zip.part');
  await downloadTo('ytdlp', `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${asset}`, tmp);
  const dist = ytdlpDistDir();
  const fresh = path.join(bin, 'yt-dlp-dist.new');
  const old = path.join(bin, 'yt-dlp-dist.old');
  await fs.rm(fresh, { recursive: true, force: true });
  try {
    await extractAll(tmp, fresh);
  } finally {
    await fs.rm(tmp, { force: true });
  }
  const main = ytdlpInDist(fresh);
  if (!main) throw new Error(L('в архиве yt-dlp нет исполняемого файла', 'the yt-dlp archive has no executable'));
  if (!isWin) await fs.chmod(main, 0o755);
  // Swap folders. On Windows this fails while a yt-dlp from the old folder is
  // running; the old one then stays and the next start tries again.
  await fs.rm(old, { recursive: true, force: true });
  if (existsSync(dist)) {
    await fs.rename(dist, old).catch((e: Error) => {
      throw new Error(
        L(`yt-dlp сейчас занят, обновлю позже: ${e.message}`, `yt-dlp is busy, will update later: ${e.message}`),
      );
    });
  }
  await fs.rename(fresh, dist);
  await fs.rm(old, { recursive: true, force: true });
  // The single-file build from earlier versions of EXØS.
  await fs.rm(path.join(bin, exe('yt-dlp')), { force: true });
  await fs.writeFile(stamp(), '').catch(() => {});
}

/** The newest release tag, read from GitHub's redirect without the API. */
async function latestYtdlpTag(): Promise<string> {
  const res = await fetch('https://github.com/yt-dlp/yt-dlp/releases/latest', {
    headers: { 'User-Agent': UA },
    redirect: 'manual',
    signal: AbortSignal.timeout(20_000),
  });
  const location = res.headers.get('location');
  if (!location) throw new Error(L('GitHub не ответил редиректом', 'GitHub did not answer with a redirect'));
  const tag = location.split('/').pop();
  if (!tag) throw new Error(L('нет тега', 'no tag'));
  return tag;
}

export async function install(tool: string): Promise<void> {
  const bin = binDir();
  await fs.mkdir(bin, { recursive: true });
  if (tool === 'ytdlp') await installYtdlp();
  else if (tool === 'deno') {
    const target = denoTarget();
    if (!target) throw new Error(L('под эту систему нет готового Deno', 'no Deno build for this system'));
    const tmp = path.join(bin, 'deno.zip.part');
    await downloadTo('deno', `https://github.com/denoland/deno/releases/latest/download/deno-${target}.zip`, tmp);
    try {
      await extract(tmp, [exe('deno')], bin);
    } finally {
      await fs.rm(tmp, { force: true });
    }
  } else if (tool === 'ffmpeg') {
    const asset = ffmpegAsset();
    if (!asset)
      throw new Error(
        L(
          'ffmpeg ставится через систему: brew install ffmpeg или пакет ffmpeg',
          'install ffmpeg through the system: brew install ffmpeg or the ffmpeg package',
        ),
      );
    const tmp = path.join(bin, 'ffmpeg.zip.part');
    await downloadTo('ffmpeg', `https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/${asset}`, tmp);
    try {
      await extract(tmp, [exe('ffmpeg'), exe('ffprobe')], bin);
    } finally {
      await fs.rm(tmp, { force: true });
    }
  } else throw new Error(L(`неизвестный инструмент ${tool}`, `unknown tool ${tool}`));
  emit('engine://install-progress', { tool, progress: 1 });
}

/**
 * Updates our own copy to the latest release. A system yt-dlp belongs to its
 * package manager. The single-file build of earlier versions is replaced by
 * the faster unpacked one.
 */
export async function updateYtdlp(): Promise<string> {
  const found = locate('yt-dlp');
  if (!found) throw new Error(L('yt-dlp не установлен', 'yt-dlp is not installed'));
  if (!found.managed)
    throw new Error(
      L(
        `это системный yt-dlp (${found.path}), обнови его тем же способом, каким ставил`,
        `this is the system yt-dlp (${found.path}); update it the way you installed it`,
      ),
    );
  const unpacked = found.path.startsWith(ytdlpDistDir());
  if (unpacked) {
    const [latest, current] = await Promise.all([latestYtdlpTag(), versionOf(found.path, ['--version'])]);
    if (current === latest) {
      await fs.writeFile(stamp(), '').catch(() => {});
      return latest;
    }
  }
  await installYtdlp();
  const now = locate('yt-dlp');
  const v = now && (await versionOf(now.path, ['--version']));
  if (!v) throw new Error(L('yt-dlp не запускается', 'yt-dlp does not start'));
  return v;
}

/**
 * YouTube breaks old yt-dlp releases every few weeks, so our copy updates
 * itself in the background at most once a day. A single-file copy left by an
 * earlier version is swapped for the unpacked build right away.
 */
export async function autoUpdate(): Promise<void> {
  const found = locate('yt-dlp');
  if (!found?.managed) return;
  const legacy = !found.path.startsWith(ytdlpDistDir());
  let fresh = false;
  try {
    fresh = Date.now() - statSync(stamp()).mtimeMs < 20 * 3600_000;
  } catch {}
  if (fresh && !legacy) return;
  try {
    await updateYtdlp();
  } catch (e) {
    console.error(`yt-dlp update: ${(e as Error).message}`);
  }
}

export const _test = { extractAll, ytdlpInDist };
