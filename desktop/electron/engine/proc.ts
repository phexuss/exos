/** Running the tools without flashing a console window on Windows. */
import { type ChildProcess, spawn } from 'node:child_process';
import { L } from './i18n';

export function start(program: string, args: string[]): ChildProcess {
  return spawn(program, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
}

/** Runs a tool and returns trimmed stdout, or stderr's most useful line as the error. */
export function output(program: string, args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let child: ChildProcess;
    try {
      child = start(program, args);
    } catch (e) {
      reject(
        new Error(
          L(
            `не удалось запустить ${program}: ${(e as Error).message}`,
            `could not start ${program}: ${(e as Error).message}`,
          ),
        ),
      );
      return;
    }
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout?.on('data', (b: Buffer) => out.push(b));
    child.stderr?.on('data', (b: Buffer) => err.push(b));
    const timer = setTimeout(() => {
      child.kill();
      reject(
        new Error(
          L(
            `${program} не ответил за ${Math.round(timeoutMs / 1000)} с`,
            `${program} did not answer in ${Math.round(timeoutMs / 1000)} s`,
          ),
        ),
      );
    }, timeoutMs);
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(new Error(L(`не удалось запустить ${program}: ${e.message}`, `could not start ${program}: ${e.message}`)));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(Buffer.concat(out).toString('utf8').trim());
      else reject(new Error(lastErrorLine(Buffer.concat(err).toString('utf8'))));
    });
  });
}

/** The most useful line of a yt-dlp / ffmpeg error log. */
export function lastErrorLine(stderr: string): string {
  const lines = stderr
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const line = [...lines].reverse().find((l) => l.startsWith('ERROR')) ?? lines.at(-1);
  return line ? line.replace(/^ERROR:/, '').trim() : L('неизвестная ошибка', 'unknown error');
}
