# EXØS desktop (Flutter)

The desktop player for Windows, macOS and Linux, replacing the Tauri app in
`desktop/` once it reaches parity. Same idea as before: search, lyrics,
recommendations and history sync go through `exos-api`, but **audio never
touches the server**. yt-dlp runs on the user's computer with their own IP.

What changed from the Tauri build:

- **Audio plays through mpv** (`media_kit`). mpv opens YouTube and SoundCloud
  links itself, with yt-dlp's headers, and follows HLS playlists. There is no
  loopback proxy and no stitching of HLS pieces before playback.
- **When a stream dies early** (a 403 from an expired link, a dropped
  connection) the player sees the track end before its length, resolves a
  fresh link and resumes at the same second, up to twice per track.
- **The engine is Dart** (`lib/engine/io`): it finds or installs yt-dlp, Deno
  and ffmpeg, resolves SoundCloud natively through its API, exports browser
  cookies, and runs downloads. Data, tools and `library.json` live in the same
  folders as the Tauri build, so nothing has to be reinstalled or re-downloaded.
- **The UI draws on the GPU**: a fragment shader for the ambient light
  (`shaders/ambient.frag`), frosted glass panels, a 3D cover on Now Playing,
  karaoke lyrics, and the seek bar advanced every frame. Settings → Appearance
  has a frame counter to check 144/165 Hz.

```
lib/
  core/      API client, models, services (shared shapes with apps/mobile)
  engine/    local engine: io/ for desktop, mock for the web prototype
  player/    PlayerStore and the mpv backend
  state/     settings, library and downloads, auth, navigation, toasts
  ui/        shell, player dock, Now Playing, screens, widgets
shaders/     ambient.frag
```

## Running

Needs a current Flutter stable (built and tested with 3.47).

**Linux** also needs mpv's library and the GTK toolchain:

```sh
# Arch
sudo pacman -S mpv gtk3 clang cmake ninja pkgconf
# Debian/Ubuntu
sudo apt install libmpv-dev mpv libgtk-3-dev clang cmake ninja-build pkg-config
```

```sh
cd apps/desktop
flutter pub get
flutter run -d linux            # or windows / macos
flutter build linux --release   # build/linux/x64/release/bundle/exos
```

Windows and macOS bundle libmpv through `media_kit_libs_audio`; nothing extra
to install.

## Design prototype

`--dart-define=EXOS_MOCK=true` swaps the API and engine for example data and a
fake player, so the whole UI runs in a browser:

```sh
flutter run -d chrome --dart-define=EXOS_MOCK=true
flutter build web --dart-define=EXOS_MOCK=true --no-web-resources-cdn
```

`EXOS_API` overrides the server (default `https://exos-api.phexuss.dev/api`).
