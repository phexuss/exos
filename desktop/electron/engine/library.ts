/**
 * The list of downloaded tracks and the playlists each live in one JSON file
 * next to the tools. The window owns their shape; the engine only stores them.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { libraryFile, playlistsFile } from './paths';
import { L } from './i18n';

export async function read(file = libraryFile()): Promise<unknown[] | null> {
  let text: string;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
  try {
    return JSON.parse(text) as unknown[];
  } catch (e) {
    throw new Error(
      L(
        `${path.basename(file)} повреждён: ${(e as Error).message}`,
        `${path.basename(file)} is damaged: ${(e as Error).message}`,
      ),
    );
  }
}

export async function write(tracks: unknown, file = libraryFile()): Promise<void> {
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
