# EXØS desktop

Tauri 2 app for Windows, macOS and Linux. Same account, search, lyrics and
recommendations as the phone app, but **audio never goes through the EXØS
server**: yt-dlp runs on the user's computer and fetches from YouTube and
SoundCloud with the user's own IP. That sidesteps the VPS's bot checks, rate
limits and IP-bound stream URLs.

```
desktop/
  src/              React + Vite UI (shares tokens with apps/mobile)
  src-tauri/        Rust: tool management, yt-dlp runs, library file
```

## What runs where

| | Goes through |
| --- | --- |
| Login, search, charts, artists, albums, lyrics, Last.fm recs, play history sync | `exos-api` (via the Tauri HTTP plugin, so no CORS change on the API) |
| Finding the audio, streaming, downloading | `yt-dlp` on this computer |

The local engine is three tools, each found on `PATH` or installed by the app
into its own data folder in one click (Settings → Local engine):

- **yt-dlp**: the official standalone build; our copy runs `yt-dlp -U` in the
  background at most once a day.
- **Deno** (or an existing Node/Bun): yt-dlp needs a JS runtime to solve
  YouTube's challenges; it is passed with `--js-runtimes`.
- **ffmpeg**: needed for SoundCloud's HLS-only tracks and for MP3. One-click
  install on Windows (yt-dlp's FFmpeg-Builds); on macOS/Linux use
  `brew install ffmpeg` / the distro package.

yt-dlp is installed as the unpacked ("onedir") release build
(`yt-dlp_win.zip`, `yt-dlp_linux.zip`, `yt-dlp_macos.zip`) into
`bin/yt-dlp-dist`: the single-file build unpacks a Python runtime to a temp
folder on every run, which costs seconds per track on Windows. The unpacked
build can't `-U`, so the app checks the latest tag (from GitHub's
`releases/latest` redirect) at most daily and swaps the folder. A single-file
copy left by an older version is replaced on the next start.

SoundCloud skips yt-dlp: `soundcloud.rs` scrapes the web client id, resolves
the page URL and picks one transcoding (progressive before HLS, AAC before
MP3). Progressive streams go through the loopback proxy; HLS whose pieces
concatenate into a playable file (MP3 chunks, fMP4 with an init segment) is
fetched 8 pieces at a time. Anything else falls back to yt-dlp.

The player resolves the next queued track a few seconds into the current one,
and remembers which YouTube video a Deezer track resolved to, so replays and
downloads skip the search.

Source choice mirrors `apps/api/src/download/download.service.ts`: Deezer
tracks resolve as `ytsearch1:<ISRC>` (fallback `artist title`), SoundCloud
tracks by their page URL.

- **Play**: `yt-dlp --print` resolves a direct audio URL plus the headers it
  used. The `<audio>` element never touches the CDN or Tauri's asset protocol
  (WebKitGTK won't play media from custom schemes): `media.rs` runs a loopback
  HTTP server on `127.0.0.1` that proxies CDN streams with yt-dlp's headers and
  serves files from disk, both with Range support, behind a per-launch secret.
  HLS sources, or a URL that fails to play, are pulled into the cache first
  (`cache_track`) and played from disk.
- **Download**: yt-dlp writes into a scratch folder, `-x --audio-format m4a`
  (stream copy for YouTube's AAC) or mp3, tagged with the Deezer/SoundCloud
  title/artist/album, then the file moves to `~/Music/EXØS/Artist - Title.m4a`.
  Two downloads run at once; the rest queue. Progress comes from
  `--progress-template`.
- If YouTube asks to sign in, Settings → "Browser cookies for YouTube" picks a
  browser. yt-dlp exports its cookies to a file at most every 30 minutes and
  each run gets a private copy (`--cookies`), instead of re-reading the browser
  on every run. "Check cookies" shows whether a YouTube sign-in was found.

The downloaded-tracks list is `library.json` in the app data folder; downloads
are also pushed to `/library/downloads` so they show up on the phone.

## Linux notes

- **Nvidia + Wayland**: WebKitGTK either dies with a Wayland protocol error or
  can't allocate GBM buffers. When `/proc/driver/nvidia` exists the app sets
  `__NV_DISABLE_EXPLICIT_SYNC=1` and `WEBKIT_DMABUF_RENDERER_DISABLE_GBM=1`
  before the webview starts (unless already set).
- **Refresh rate**: WebKitGTK paces frames with libdrm's `drmWaitVBlank`,
  which Nvidia's driver doesn't support, so it falls back to a fixed 60 fps
  timer. The binary exports its own `drmWaitVBlank` (`src/vblank.rs`,
  `build.rs`) that forwards to libdrm and, only when the driver refuses, sleeps
  one refresh of the CRTC's mode instead. It also turns off WebKit's
  `PreferPageRenderingUpdatesNear60FPSEnabled`. `EXOS_VBLANK=0` disables the
  emulation.

## Develop

```bash
cd desktop
npm install
npm run tauri dev      # the app
npm run dev            # UI only in a browser, with example data
```

Linux needs `libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev` to build, and
GStreamer plugins (`gstreamer1.0-plugins-good`, `-bad`, `gstreamer1.0-libav`)
for the webview to play AAC.

`VITE_API_URL` overrides the API (default `https://exos-api.phexuss.dev/api`).
A different host also has to be added to the `http:default` scope in
`src-tauri/capabilities/default.json`.

`npx vite build --mode prototype` builds the UI with example data into one
HTML file (`dist-prototype/index.html`), which is how the design preview was
made.

## Build

`npm run tauri build`, or the "Desktop app" workflow, which builds Windows
(NSIS + MSI), macOS (universal DMG) and Linux (deb + AppImage) installers on
every PR touching `desktop/` and uploads them as workflow artifacts. They are
not code-signed yet, so Windows SmartScreen and macOS Gatekeeper will warn
(macOS: right-click → Open).
