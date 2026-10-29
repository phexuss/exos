/**
 * The list of downloaded tracks lives in one JSON file next to the tools. The
 * window owns its shape; the engine only stores it.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { libraryFile } from './paths';
import { L } from './i18n';

export async function read(): Promise<unknown[] | null> {
  let text: string;
  try {
    text = await fs.readFile(libraryFile(), 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
  try {
    return JSON.parse(text) as unknown[];
  } catch (e) {
    throw new Error(
      L(`library.json повреждён: ${(e as Error).message}`, `library.json is damaged: ${(e as Error).message}`),
    );
  }
}

export async function write(tracks: unknown): Promise<void> {
  const file = libraryFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(tracks));
  await fs.rename(tmp, file);
}

const AUDIO_EXTS = ['m4a', 'mp3', 'opus', 'webm', 'ogg', 'flac', 'aac', 'mp4'];

/** Deletes a downloaded audio file; refuses anything that isn't audio. */
export async function deleteAudio(p: string): Promise<void> {
  if (!AUDIO_EXTS.includes(path.extname(p).slice(1).toLowerCase()))
    throw new Error(L('это не аудиофайл', 'not an audio file'));
  await fs.rm(p, { force: true });
}

export const fileExists = (p: string) => fs.stat(p).then((s) => s.isFile(), () => false);
