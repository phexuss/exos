/**
 * Browser cookies for YouTube, read once and reused.
 *
 * `--cookies-from-browser` reopens (and for Chromium browsers decrypts) the
 * whole cookie store on every yt-dlp run, which costs seconds and fails while
 * the browser holds a lock. Instead yt-dlp exports them to a file every half
 * hour, and each run gets its own copy, because yt-dlp writes the file back on
 * exit and two parallel runs would clobber a shared one.
 */
import { statSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { dataDir, workDir } from './paths';
import { output } from './proc';
import * as tools from './tools';
import { L } from './i18n';

const FRESH_FOR = 30 * 60_000;
const EXPORT_TIMEOUT = 60_000;
/** Cookies only a signed-in YouTube/Google session has. */
const SIGNED_IN = ['SAPISID', '__Secure-3PAPISID', 'LOGIN_INFO', 'SID'];

export type CookieCheck = { count: number; youtube: number; signedIn: boolean };

const fileFor = (browser: string) => path.join(dataDir(), `cookies-${browser}.txt`);

function isFresh(p: string): boolean {
  try {
    return Date.now() - statSync(p).mtimeMs < FRESH_FOR;
  } catch {
    return false;
  }
}

/** One export at a time; parallel plays wait for the running one. */
let exporting: Promise<string> | null = null;

/**
 * Has yt-dlp write the browser's cookies to our file. With no URL yt-dlp exits
 * with a usage error, but only after saving the cookie jar.
 */
function exportCookies(browser: string): Promise<string> {
  exporting ??= (async () => {
    const dest = fileFor(browser);
    const ytdlp = await tools.ytdlp();
    if (!ytdlp) throw new Error(L('yt-dlp не установлен', 'yt-dlp is not installed'));
    const tmp = dest.replace(/\.txt$/, '.new');
    await fs.rm(tmp, { force: true });
    await fs.mkdir(dataDir(), { recursive: true });
    let why = '';
    await output(ytdlp.path, ['--ignore-config', '--cookies-from-browser', browser, '--cookies', tmp], EXPORT_TIMEOUT).catch(
      (e: Error) => {
        why = e.message;
      },
    );
    const written = await fs.stat(tmp).then((s) => s.size > 0, () => false);
    if (!written) {
      const lower = why.toLowerCase();
      if (lower.includes('could not find'))
        throw new Error(
          L(
            `не нашёл профиль браузера (${browser}). Он установлен и хоть раз запускался?`,
            `browser profile not found (${browser}). Is it installed and has it been opened at least once?`,
          ),
        );
      if (lower.includes('could not copy') || lower.includes('database is locked'))
        throw new Error(
          L(
            'браузер держит куки заблокированными. Закрой его и попробуй снова',
            'the browser keeps its cookies locked. Close it and try again',
          ),
        );
      if (lower.includes('keyring') || lower.includes('secretstorage') || lower.includes('decrypt'))
        throw new Error(
          L(
            'не получилось расшифровать куки (связка ключей). Попробуй Firefox',
            'could not decrypt the cookies (keyring). Try Firefox',
          ),
        );
      throw new Error(
        !why || lower.includes('at least one url')
          ? L('yt-dlp не выгрузил куки', 'yt-dlp did not export the cookies')
          : why,
      );
    }
    await fs.rename(tmp, dest);
    return dest;
  })().finally(() => {
    exporting = null;
  });
  return exporting;
}

/**
 * A private copy of fresh cookies for one yt-dlp run, or null when the
 * browser can't be read (the run then goes without cookies).
 */
export async function forRun(browser: string): Promise<string | null> {
  const shared = fileFor(browser);
  if (!isFresh(shared)) {
    try {
      await exportCookies(browser);
    } catch (e) {
      console.error(`cookies: ${(e as Error).message}`);
      if (!(await fs.stat(shared).then(() => true, () => false))) return null;
    }
  }
  try {
    await fs.mkdir(workDir(), { recursive: true });
    const copy = path.join(workDir(), `cookies-${process.hrtime.bigint()}.txt`);
    await fs.copyFile(shared, copy);
    return copy;
  } catch {
    return null;
  }
}

/** Re-reads the browser now and says what came out, for the Settings check. */
export async function check(browser: string): Promise<CookieCheck> {
  const text = await fs.readFile(await exportCookies(browser), 'utf8');
  let count = 0;
  let youtube = 0;
  let signedIn = false;
  for (let line of text.split(/\r?\n/)) {
    line = line.replace(/^#HttpOnly_/, '');
    if (!line || line.startsWith('#')) continue;
    const cols = line.split('\t');
    if (cols.length < 7) continue;
    count += 1;
    const domain = cols[0].replace(/^\./, '');
    if (domain === 'youtube.com' || domain.endsWith('.youtube.com')) {
      youtube += 1;
      if (SIGNED_IN.includes(cols[5])) signedIn = true;
    }
  }
  return { count, youtube, signedIn };
}
