<div align="center">

# EXØS

**A music player for the desktop that finds, streams and downloads tracks from several sources on your own computer.**

[![Electron](https://img.shields.io/badge/Electron-45-47848F?logo=electron)](https://www.electronjs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)](https://nestjs.com)
[![License](https://img.shields.io/badge/License-Private-333333)](#)

<img width="900" alt="EXØS desktop: home" src="https://github.com/user-attachments/assets/d402a5cc-f5f2-4d8d-ace4-707cd2da7581" />

</div>

---

## Status

| App | State |
| --- | --- |
| **Desktop** (`desktop/`) | **In active development.** This is where the work goes now; new releases come out often. |
| **Android** (`apps/mobile`) | **On hold, half-working.** Development is paused for now, with no date to pick it back up. Builds install and parts work, but playback and downloads are unreliable. |
| Server (`apps/api`) | Running; serves both apps (search, lyrics, recommendations, accounts). |

## What is EXØS

EXØS is a music player that aggregates tracks from **Deezer** and **SoundCloud**, gets full audio through **yt-dlp**, and keeps it locally for offline playback, with synced lyrics, recommendations and an account that syncs your library. The [desktop app](#exøs-on-the-desktop) is the main one: there the computer itself is the player. An [Android app](#the-android-app-on-hold) exists too but is on hold.

## EXØS on the desktop

<div align="center">
<!-- Screenshots: replace each src with an uploaded image URL. Window shots at 16:10 look best. -->
<img width="445" alt="EXØS desktop: full-window player with lyrics"  src="https://github.com/user-attachments/assets/f16d7921-e211-4b0a-8736-d49f3d845138"  />


<img width="445" alt="EXØS desktop: a playlist imported from Spotify" src="https://github.com/user-attachments/assets/b2c023bd-7c3d-4ec8-9246-586a1a139c77" />
</div>

The phone app asks the EXØS server for audio. The desktop app turns that around: **it is a local player**. A computer can run yt-dlp, ffmpeg and a JavaScript runtime by itself, so it does. Audio is found, streamed and downloaded on your machine, from your own IP, and never passes through the server. The server is left with what it is good at: search, lyrics, recommendations and your account.

- **Your computer does the work.** The engine installs its own yt-dlp, Deno and ffmpeg in one click, keeps yt-dlp up to date, and plays SoundCloud straight from its API.
- **Files you own.** Downloads land in a plain music folder as Opus, M4A or MP3 (128, 192 or 320 kbit/s) and open in any player.
- **Your playlists, wherever they were.** Make playlists here, or bring one over by link from Spotify or SoundCloud. Drag tracks in, drag them into order.
- **Sound you can bend.** Sped up, slowed + reverb, live on any track. A volume curve that is quiet at 1% the way a mixer is.
- **Lyrics** synced line by line when they exist, plain when they do not.
- **One library in the cloud.** Sign up right in the app. Everything you download is listed in your account, from the phone too; whatever is missing on this computer downloads again in one click.
- **Feels native.** Draws at your monitor's refresh rate, keeps what it has seen on disk, preloads what you are about to click.
- Windows, macOS and Linux · English and Russian · the same account as the phone app.

**Download:** the latest `desktop-v…` release on the [Releases page](https://github.com/phexuss/exos/releases?q=desktop&expanded=true). Builds are not signed yet: on Windows choose More info → Run anyway, on macOS right-click → Open.

## The Android app (on hold)

> Development of the phone app is paused and it is only partly working. What it was built to do:

<div align="center">
<img height="600" src="https://github.com/user-attachments/assets/161a78c6-ba7c-44b9-a6eb-099eaafaa49c" />
<img height="600" src="https://github.com/user-attachments/assets/8bfe8ffb-ace0-463c-8cbf-0308bfaac018" />
<img height="600" src="https://github.com/user-attachments/assets/ae84929d-7bac-4064-abc0-2cd737e41254" />
</div>


- **Multi-source search** — query Deezer and SoundCloud catalogs from a single search bar
- **Full track downloads** — audio fetched via yt-dlp through a ticket-based queue system
- **Offline playback** — downloaded tracks play instantly with no internet required
- **Synchronized lyrics** — timed lyrics fetched from LRCLIB API, even for SoundCloud tracks if they're somewhat popular
- **Recommendations** — "Because you listened to…" powered by Last.fm similar tracks
- **Cloud library sync** — backed-up downloads and play history synced to your account
- **Playlists** — create local playlists, bulk-add tracks, manage your library
- **Dynamic accent color** — player UI tinted with the dominant album cover color
- **Offline mode** — full app access without an account (no sync, no profile)
- **i18n** — English and Russian

## Tech Stack

### Desktop app — `desktop`

| Layer    | Technology                                                    |
| -------- | ------------------------------------------------------------- |
| Shell    | Electron · Windows, macOS, Linux; engine in a utility process  |
| UI       | React 18 · Vite · Zustand · Motion · Lucide (tokens shared with mobile) |
| Audio    | yt-dlp + Deno + ffmpeg running on the user's own computer     |

Search, lyrics, account and library sync use the API; audio is fetched by yt-dlp locally, from the user's IP. See [`desktop/README.md`](desktop/README.md).

### Android app — `apps/mobile` (on hold)

| Layer      | Technology                                                                      |
| ---------- | ------------------------------------------------------------------------------- |
| Framework  | React Native 0.81 · Expo SDK 54 (New Architecture)                             |
| Navigation | Expo Router (file-based)                                                        |
| State      | Zustand                                                                         |
| Audio      | react-native-track-player                                                       |
| UI         | Custom components · Solar Icons · Jost font family                            |
| Animations | react-native-reanimated                                                         |
| Lists      | @shopify/flash-list                                                             |
| Storage    | expo-sqlite (local DB) · expo-secure-store (tokens) · AsyncStorage (settings) |

### Backend — `apps/api`

| Layer     | Technology                                                 |
| --------- | ---------------------------------------------------------- |
| Framework | NestJS                                                     |
| Database  | PostgreSQL (Neon)                                          |
| Cache     | Redis (Upstash)                                            |
| Auth      | JWT access/refresh tokens · email verification via Resend |
| Download  | yt-dlp with concurrency limits and ticket queue            |
| APIs      | Deezer · SoundCloud · Last.fm · LRCLIB                  |

### Landing Page — `apps/web`

| Layer      | Technology                              |
| ---------- | --------------------------------------- |
| Framework  | Next.js 16 (App Router)                 |
| UI         | Tailwind CSS 4 · shadcn/ui · Radix UI |
| Animations | Motion (Framer Motion)                  |
| Icons      | Lucide React                            |
| i18n       | next-intl                               |

> **Note:** The landing page is a standalone marketing site with no integration to the mobile app or API. It serves as a promotional page only — authentication, music playback, and all app features live in the apps.

### Infrastructure

| Component | Technology                  |
| --------- | --------------------------- |
| Database  | Neon (serverless Postgres)  |
| Cache     | Upstash (serverless Redis)  |
| Email     | Resend                      |
| Builds    | EAS Build                   |
| Monorepo  | pnpm workspaces · Turborepo |
| Linting   | Biome                       |

## Architecture

```mermaid
graph LR
  subgraph Client
    M["Mobile App<br/>(Expo · React Native)"]
    M_ST["Zustand · SQLite<br/>Track Player"]
  end

  M --- M_ST

  M <-->|HTTPS| API

  subgraph API["NestJS API"]
    AUTH["Auth<br/>JWT + Resend"]
    SEARCH["Search<br/>Deezer · SoundCloud"]
    DL["Download<br/>yt-dlp · ticket queue"]
    SYNC["Library Sync"]
  end

  AUTH <--> PG["PostgreSQL<br/>(Neon)"]
  SYNC <--> PG
  AUTH <--> REDIS["Redis<br/>(Upstash)"]
  DL <--> REDIS

  SEARCH --> LASTFM["Last.fm<br/>recommendations"]
  SEARCH --> DEEZER["Deezer API"]
  SEARCH --> SC["SoundCloud API"]
  DL --> YT["YouTube<br/>(via yt-dlp)"]
  DL --> LRCLIB["LRCLIB<br/>synced lyrics"]
```

**Download flow:** Client requests download → API creates a ticket → yt-dlp searches YouTube by track name → audio is transcoded and returned → client saves to device storage and syncs metadata to cloud.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Android SDK (only for the on-hold mobile app)
- yt-dlp installed on the server

### Install

```bash
git clone https://github.com/phexuss/exos.git
cd exos
pnpm install
```

### Run the desktop app

```bash
cd desktop
npm ci
npm start        # builds and opens the app
npm run dev      # UI only, in the browser with example data
```

### Run the mobile app (on hold)

```bash
cp apps/mobile/.env.example apps/mobile/.env
cd apps/mobile
npx expo start
```

### Run the API

```bash
cp .env.production.example apps/api/.env
cd apps/api
pnpm dev
```

### Environment Variables

**Mobile** (`apps/mobile/.env`):

```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**API** (`apps/api/.env`):

```
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
YTDLP_PATH=/usr/bin/yt-dlp
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
LASTFM_API_KEY=...
RESEND_API_KEY=...
# optional, enables Spotify import
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=https://<api-host>/api/spotify/callback
```

## Project Structure

```
exos/
├── apps/
│   ├── api/          # NestJS backend
│   ├── mobile/       # React Native (Expo) app, on hold
│   └── web/          # Landing page (Next.js)
├── desktop/          # Electron desktop app (own package-lock, npm)
├── turbo.json        # Turborepo config
├── biome.json        # Linter/formatter
└── pnpm-workspace.yaml
```

---

<div align="center">
  <sub>Built by <a href="https://github.com/phexuss">phexuss</a></sub>
</div>
