/**
 * The engine: everything slow or blocking runs here, in Electron's utility
 * process, away from both the window and the main process. yt-dlp runs,
 * downloads, the audio proxy, SoundCloud, API requests and their disk cache.
 *
 * The window talks to it over a MessagePort the main process hands to both
 * sides, so requests never pass through (or wait on) the main process.
 */
import fs from 'node:fs/promises';
import type { MessagePortMain } from 'electron';
import { addPort } from './bus';
import { setLocale } from './i18n';
import * as cookies from './cookies';
import * as http from './http';
import * as library from './library';
import * as media from './media';
import * as soundcloud from './soundcloud';
import * as spotify from './spotify';
import { playlistsFile, workDir } from './paths';
import * as tools from './tools';
import * as ytdlp from './ytdlp';

type Args = Record<string, any>;

const handlers: Record<string, (a: Args) => unknown> = {
  hello: () => ({ mediaBase: media.mediaBase() }),
  engine_status: () => tools.status(),
  engine_install: (a) => tools.install(a.tool),
  engine_update_ytdlp: () => tools.updateYtdlp(),
  resolve_stream: (a) => ytdlp.resolveStream(a.req),
  cache_track: (a) => ytdlp.cacheTrack(a.id, a.req),
  download_track: (a) => ytdlp.downloadTrack(a.req),
  cancel_download: (a) => ytdlp.cancel(a.id),
  library_read: () => library.read(),
  library_write: (a) => library.write(a.tracks),
  playlists_read: () => library.read(playlistsFile()),
  playlists_write: (a) => library.write(a.playlists, playlistsFile()),
  delete_file: (a) => library.deleteAudio(a.path),
  file_exists: (a) => library.fileExists(a.path),
  media_file: (a) => media.fileUrl(a.path),
  check_cookies: (a) => cookies.check(a.browser),
  http: (a) => http.request(a.req),
  import_soundcloud: (a) => soundcloud.playlist(a.url),
  import_spotify: (a) => spotify.playlist(a.url),
  spotify_tracks: (a) => spotify.tracks(a.ids),
};

const ready = media.start();

function attach(port: MessagePortMain) {
  addPort(port);
  port.on('message', async ({ data }) => {
    const { id, cmd, args, lang } = data as {
      id: number;
      cmd: string;
      args?: Args;
      lang?: string;
    };
    setLocale(lang);
    try {
      await ready;
      const fn = handlers[cmd];
      if (!fn) throw new Error(`unknown command ${cmd}`);
      port.postMessage({ id, ok: true, value: await fn(args ?? {}) });
    } catch (e) {
      port.postMessage({ id, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  });
  port.start();
}

process.parentPort.on('message', (e) => {
  if ((e.data as { type?: string })?.type === 'port' && e.ports[0]) attach(e.ports[0]);
});

// Leftovers from downloads interrupted by quitting.
void fs.rm(workDir(), { recursive: true, force: true });
// Nothing here is needed to draw the first screen; give startup the disk and network first.
setTimeout(() => {
  void tools.autoUpdate();
  void media.pruneImages();
}, 5000);
