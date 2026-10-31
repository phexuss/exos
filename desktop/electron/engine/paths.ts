/**
 * Where EXØS keeps its tools, caches and the library index. The folders match
 * the Tauri build's, so tools, downloads and library.json carry over.
 */
import os from 'node:os';
import path from 'node:path';

const ID = 'dev.phexuss.exos';
const home = os.homedir();

export function dataDir(): string {
  switch (process.platform) {
    case 'win32':
      return path.join(process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), ID);
    case 'darwin':
      return path.join(home, 'Library', 'Application Support', ID);
    default:
      return path.join(process.env.XDG_DATA_HOME || path.join(home, '.local', 'share'), ID);
  }
}

function cacheRoot(): string {
  switch (process.platform) {
    case 'win32':
      return dataDir();
    case 'darwin':
      return path.join(home, 'Library', 'Caches', ID);
    default:
      return path.join(process.env.XDG_CACHE_HOME || path.join(home, '.cache'), ID);
  }
}

/** yt-dlp, deno and ffmpeg that EXØS downloaded itself. */
export const binDir = () => path.join(dataDir(), 'bin');
/** Tracks pulled down only to be played (HLS sources, fallbacks). */
export const streamCacheDir = () => path.join(cacheRoot(), 'stream');
/** Cover art, kept so the UI draws without the network. */
export const imageCacheDir = () => path.join(cacheRoot(), 'img');
/** Catalogue answers from the API, served while offline or until refreshed. */
export const apiCacheDir = () => path.join(cacheRoot(), 'api');
/** Per-download scratch folders; finished files are moved out of here. */
export const workDir = () => path.join(dataDir(), 'work');
export const libraryFile = () => path.join(dataDir(), 'library.json');
export const playlistsFile = () => path.join(dataDir(), 'playlists.json');
/** Lyrics the user typed, pasted or picked for a track; they win over found ones. */
export const lyricsFile = () => path.join(dataDir(), 'lyrics.json');

/** The main process knows the OS music folder; it passes it in. */
export const defaultMusicDir = () =>
  path.join(process.env.EXOS_MUSIC_DIR || path.join(home, 'Music'), 'EXØS');

export const exe = (name: string) => (process.platform === 'win32' ? `${name}.exe` : name);
