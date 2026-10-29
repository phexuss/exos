# EXØS desktop

Electron app for Windows, macOS and Linux. Same account, search, lyrics and
recommendations as the phone app, but **audio never goes through the EXØS
server**: yt-dlp runs on the user's computer and fetches from YouTube and
SoundCloud with the user's own IP.

```
desktop/
  src/               React UI (Vite)
  electron/
    main.ts          main process: window, app:// files, starts the engine
    preload.ts       the window's bridge: engine calls, window controls
    engine/          utility process: yt-dlp, SoundCloud, audio proxy, caches
  resources/         icons
  scripts/           esbuild bundling, engine tests
```

## How it is split

Electron's main process stays thin. It opens the window, serves the UI from
`app://` and answers what only it can do (window controls, folder picker, file
manager). Everything slow runs in the **engine**, a utility process: yt-dlp
runs and downloads, the audio proxy, SoundCloud, API requests and their caches.

The main process hands the window and the engine the two ends of a
`MessageChannel`, so the UI talks to the engine directly and asynchronously;
nothing waits on the main process, and if the engine dies it is restarted and
reconnected.

| | Goes through |
| --- | --- |
| Login, search, charts, artists, albums, lyrics, Last.fm recs, play history sync | `exos-api`, requested by the engine (the API's CORS list only has the website) |
| Finding the audio, streaming, downloading | `yt-dlp` on this computer |

## Why it feels fast

- **Disk caches.** Catalogue answers (charts, albums, artists, search, lyrics)
  are kept on disk by the engine and served while fresh, and served stale when
  the network or the server fails, so screens you have seen open offline.
  Cover art is fetched once and served from disk afterwards.
- **Screens from memory, prefetched on hover.** Each screen's data lives in a
  small query cache. Resting the pointer on an album or artist starts loading
  it, so the click usually lands on a screen that is already there.
- **Skeletons shaped like the page**, never spinners, for the rare cold load.
  They shimmer with a transform, so nothing under them repaints.
- **Long lists are virtual.** A track list of 60 or more keeps only the rows
  near the viewport in the DOM; the library stays smooth at thousands of tracks.
- **Springs, on the compositor.** Selection pills, tabs, the queue and toasts
  move on `motion` springs; screens and lists use CSS springs. Everything that
  animates is a transform or opacity. The seek bar follows the playhead every
  frame through a transform, not four times a second.
- **Startup.** The UI is served from `app://` with V8 code caching, the main
  process and engine use Node's compile cache, the window shows only when the
  first frame is ready, a returning user gets the app shell before the server
  answers, and tool checks, the yt-dlp update and cache pruning wait until the
  app is idle. Settings and Downloads load on first use.

## Sound

- **Volume** follows the cube of the slider, like the Linux system mixers:
  50% is about -18 dB and 1% is next to silence.
- **Sped up / slowed + reverb** (the waveform button in the player bar) run
  live on any track: speed is the element's playback rate with the pitch
  following it, reverb is a Web Audio convolver on a generated hall impulse.
  Nothing is rendered ahead of time. The audio element loads with CORS so Web
  Audio can hear it; the engine's media server allows any origin.
- **Download format**: Opus (YouTube's best, about 160 kbit/s, no
  re-encoding), M4A (AAC as YouTube serves it) or MP3 at 128/192/320 kbit/s.

**Playlists** live on this computer in `playlists.json` next to `library.json`.
A track is kept as a snapshot, so it plays whether it is downloaded or not.
Tracks are added from the right-click menu or by dragging a row onto a
playlist in the sidebar; inside a playlist, rows drag into a new order.

**Import** (the button next to + under Playlists, or a playlist link pasted
into search) copies a SoundCloud set, or a public Spotify playlist or album,
into a local playlist. SoundCloud sets come from its web API with the same
client id the player uses. Spotify is read from the embed player page
(`open.spotify.com/embed/...`), which needs no account but is not an official
API; it gives titles, artists and lengths of the first 100 tracks. For a
longer playlist, the ids of the rest come from the playlist service the web
player reads (`spclient.wg.spotify.com`) with the anonymous token the same
page carries, and each title from that track's own embed page. Each track is
matched on Deezer by title, artist and length. A track Deezer lacks stays as artist +
title and plays through a YouTube search.

**Lyrics** come from the EXØS server (LRCLIB). When its exact match has no
text, the app searches LRCLIB itself and takes synced lyrics if any entry has
them, otherwise plain lyrics, which are shown all lit, without timing.

**Visualizer** (on by default, Settings → Visualizer): a spectrum,
oscilloscope or pair of VU meters under the cover in the full window, and
live bars next to the playing track. It reads the
audio through Web Audio analysers after the effects and before the volume,
draws on canvas from one shared loop, and stops drawing once playback is
paused.

The UI is in Russian and English (Settings → Language, or the switch on the
sign-in screen); the engine answers errors in the same language.

## Local engine

Three tools, each found on `PATH` or installed by the app into its own data
folder in one click (Settings → Local engine):

- **yt-dlp**: the unpacked ("onedir") release build in `bin/yt-dlp-dist`. It
  starts several times faster than the single-file build. The app checks the
  latest tag at most daily and swaps the folder.
- **Deno** (or an existing Node/Bun): yt-dlp needs a JS runtime for YouTube's
  challenges; it is passed with `--js-runtimes`.
- **ffmpeg**: needed for SoundCloud's HLS-only tracks and for MP3. One-click
  install on Windows; on macOS/Linux use `brew install ffmpeg` / the distro
  package.

SoundCloud skips yt-dlp: `engine/soundcloud.ts` scrapes the web client id,
resolves the page URL and picks one transcoding (progressive before HLS, AAC
before MP3). HLS whose pieces concatenate into a playable file is fetched 8
pieces at a time. Anything else falls back to yt-dlp.

The audio proxy (`engine/media.ts`) serves local files with Range support and
forwards CDN streams with yt-dlp's headers. googlevideo refuses the
open-ended `Range: bytes=N-` every player sends, so upstream is always asked
in closed 10 MiB pieces.

Tools, `library.json` and caches live in the same folders as the earlier Tauri
build (`~/.local/share/dev.phexuss.exos` on Linux,
`%LOCALAPPDATA%\dev.phexuss.exos` on Windows,
`~/Library/Application Support/dev.phexuss.exos` on macOS), so nothing has to
be reinstalled or re-downloaded.

## Running

```sh
cd desktop
npm ci
npm start                    # builds, then opens the app
npm test                     # engine tests
npx electron-builder --linux # or --win / --mac; output in release/
```

`npm run dev` runs the UI alone in a browser with example data (the design
prototype); `npx vite build --mode prototype` makes it one HTML file.

On Linux the app runs as a native Wayland client when the session is Wayland.
If a driver misbehaves, `EXOS_X11=1 exos` runs it through XWayland.

CI (`.github/workflows/desktop.yml`) builds the Windows installer, a universal
macOS dmg, and a Linux AppImage plus tar.gz, unsigned, as workflow artifacts.

## Releases

Bump `version` in `desktop/package.json` and merge to main: the workflow
builds all three systems and publishes them as a GitHub release under tag
`desktop-v<version>` (a version with a suffix, like `0.3.0-beta`, is marked
as a pre-release). The phone app keeps its own `v<version>` tags, and the
desktop release is never marked "Latest", so links to the latest APK keep
working. A manual run of the workflow on main releases the current version
if its tag does not exist yet.
