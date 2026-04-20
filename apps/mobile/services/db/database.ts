import * as SQLite from 'expo-sqlite';

import type { Track } from '@/types/domain';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('exos.db');
    await migrate(db);
  }
  return db;
}

async function migrate(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS tracks (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL,
      artist        TEXT NOT NULL,
      artist_id     TEXT,
      album         TEXT,
      cover_url     TEXT,
      duration      TEXT NOT NULL,
      duration_sec  INTEGER NOT NULL DEFAULT 0,
      file_path     TEXT NOT NULL,
      file_format   TEXT DEFAULT 'mp3',
      isrc          TEXT,
      preview_url   TEXT,
      synced_lyrics TEXT,
      plain_lyrics  TEXT,
      source        TEXT DEFAULT 'deezer',
      downloaded_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      cover_url  TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id  TEXT NOT NULL,
      track_id     TEXT NOT NULL,
      position     INTEGER,
      PRIMARY KEY (playlist_id, track_id)
    );

    CREATE TABLE IF NOT EXISTS recently_played (
      track_id   TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      artist     TEXT NOT NULL,
      artist_id  TEXT,
      album      TEXT,
      cover_url  TEXT,
      duration   TEXT NOT NULL,
      duration_sec INTEGER NOT NULL DEFAULT 0,
      preview_url TEXT,
      isrc       TEXT,
      source     TEXT NOT NULL,
      played_at  INTEGER NOT NULL
    );
  `);

  // Migration: add source column to tracks if missing
  const cols = await database.getAllAsync<{ name: string }>(
    `PRAGMA table_info(tracks)`,
  );
  if (!cols.some((c) => c.name === 'source')) {
    await database.execAsync(
      `ALTER TABLE tracks ADD COLUMN source TEXT DEFAULT 'deezer'`,
    );
  }
}

// ── Downloaded tracks ────────────────────────────────────────

export type LyricsData = {
  syncedLyrics: string | null;
  plainLyrics: string | null;
};

export async function insertDownloadedTrack(
  track: Track,
  filePath: string,
  fileFormat = 'webm',
  lyrics?: LyricsData | null,
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO tracks (id, title, artist, artist_id, album, cover_url, duration, duration_sec, file_path, file_format, isrc, preview_url, synced_lyrics, plain_lyrics, source, downloaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    track.id,
    track.title,
    track.artist.name,
    track.artist.id,
    track.album ?? null,
    track.coverUrl ?? null,
    track.duration,
    track.durationSec,
    filePath,
    fileFormat,
    track.isrc ?? null,
    track.previewUrl ?? null,
    lyrics?.syncedLyrics ?? null,
    lyrics?.plainLyrics ?? null,
    track.source ?? 'deezer',
    Date.now(),
  );
}

export async function getDownloadedTracks(): Promise<Track[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    title: string;
    artist: string;
    artist_id: string;
    album: string | null;
    cover_url: string | null;
    duration: string;
    duration_sec: number;
    file_path: string;
    isrc: string | null;
    preview_url: string | null;
    synced_lyrics: string | null;
    plain_lyrics: string | null;
    source: string | null;
  }>('SELECT * FROM tracks ORDER BY downloaded_at DESC');

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    artist: { id: r.artist_id ?? '', name: r.artist },
    album: r.album ?? undefined,
    duration: r.duration,
    durationSec: r.duration_sec,
    coverUrl: r.cover_url ?? undefined,
    previewUrl: r.preview_url ?? undefined,
    isrc: r.isrc ?? undefined,
    syncedLyrics: r.synced_lyrics ?? undefined,
    plainLyrics: r.plain_lyrics ?? undefined,
    filePath: r.file_path,
    isDownloaded: true,
    source: (r.source as Track['source']) ?? 'deezer',
  }));
}

export async function isTrackDownloaded(trackId: string): Promise<boolean> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ id: string }>(
    'SELECT id FROM tracks WHERE id = ?',
    trackId,
  );
  return !!row;
}

export async function getDownloadedTrack(trackId: string): Promise<{
  file_path: string;
} | null> {
  const database = await getDb();
  return database.getFirstAsync<{ file_path: string }>(
    'SELECT file_path FROM tracks WHERE id = ?',
    trackId,
  );
}

export async function deleteDownloadedTrack(trackId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM tracks WHERE id = ?', trackId);
  await database.runAsync('DELETE FROM playlist_tracks WHERE track_id = ?', trackId);
}

// ── Playlists ────────────────────────────────────────────────

export type PlaylistRow = {
  id: string;
  name: string;
  cover_url: string | null;
  created_at: number;
  track_count: number;
};

export async function createPlaylist(name: string, coverUrl?: string): Promise<string> {
  const database = await getDb();
  const id = `pl-${Date.now()}`;
  await database.runAsync(
    'INSERT INTO playlists (id, name, cover_url, created_at) VALUES (?, ?, ?, ?)',
    id,
    name,
    coverUrl ?? null,
    Date.now(),
  );
  return id;
}

export async function getPlaylists(): Promise<PlaylistRow[]> {
  const database = await getDb();
  return database.getAllAsync<PlaylistRow>(`
    SELECT p.*, COUNT(pt.track_id) as track_count
    FROM playlists p
    LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM playlists WHERE id = ?', playlistId);
  await database.runAsync('DELETE FROM playlist_tracks WHERE playlist_id = ?', playlistId);
}

export async function renamePlaylist(playlistId: string, name: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('UPDATE playlists SET name = ? WHERE id = ?', name, playlistId);
}

export async function updatePlaylistCover(playlistId: string, coverUrl: string | null): Promise<void> {
  const database = await getDb();
  await database.runAsync('UPDATE playlists SET cover_url = ? WHERE id = ?', coverUrl, playlistId);
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  const database = await getDb();
  const maxPos = await database.getFirstAsync<{ max_pos: number | null }>(
    'SELECT MAX(position) as max_pos FROM playlist_tracks WHERE playlist_id = ?',
    playlistId,
  );
  const position = (maxPos?.max_pos ?? -1) + 1;
  await database.runAsync(
    'INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)',
    playlistId,
    trackId,
    position,
  );
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
    playlistId,
    trackId,
  );
}

export async function getPlaylistTracks(playlistId: string): Promise<Track[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    title: string;
    artist: string;
    artist_id: string;
    album: string | null;
    cover_url: string | null;
    duration: string;
    duration_sec: number;
    file_path: string;
    isrc: string | null;
    preview_url: string | null;
    synced_lyrics: string | null;
    plain_lyrics: string | null;
    source: string | null;
  }>(`
    SELECT t.* FROM tracks t
    JOIN playlist_tracks pt ON t.id = pt.track_id
    WHERE pt.playlist_id = ?
    ORDER BY pt.position
  `, playlistId);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    artist: { id: r.artist_id ?? '', name: r.artist },
    album: r.album ?? undefined,
    duration: r.duration,
    durationSec: r.duration_sec,
    coverUrl: r.cover_url ?? undefined,
    previewUrl: r.preview_url ?? undefined,
    isrc: r.isrc ?? undefined,
    syncedLyrics: r.synced_lyrics ?? undefined,
    plainLyrics: r.plain_lyrics ?? undefined,
    filePath: r.file_path,
    isDownloaded: true,
    source: (r.source as Track['source']) ?? 'deezer',
  }));
}

// ── Recently played ──────────────────────────────────────────

export async function addRecentlyPlayed(track: Track): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO recently_played (track_id, title, artist, artist_id, album, cover_url, duration, duration_sec, preview_url, isrc, source, played_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    track.id,
    track.title,
    track.artist.name,
    track.artist.id,
    track.album ?? null,
    track.coverUrl ?? null,
    track.duration,
    track.durationSec,
    track.previewUrl ?? null,
    track.isrc ?? null,
    track.source,
    Date.now(),
  );
}

export async function getRecentlyPlayed(limit = 20): Promise<Track[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    track_id: string;
    title: string;
    artist: string;
    artist_id: string;
    album: string | null;
    cover_url: string | null;
    duration: string;
    duration_sec: number;
    preview_url: string | null;
    isrc: string | null;
    source: string;
    file_path: string | null;
  }>(
    `SELECT rp.*, t.file_path
     FROM recently_played rp
     LEFT JOIN tracks t ON rp.track_id = t.id
     ORDER BY rp.played_at DESC LIMIT ?`,
    limit,
  );

  return rows.map((r) => ({
    id: r.track_id,
    title: r.title,
    artist: { id: r.artist_id ?? '', name: r.artist },
    album: r.album ?? undefined,
    duration: r.duration,
    durationSec: r.duration_sec,
    coverUrl: r.cover_url ?? undefined,
    previewUrl: r.preview_url ?? undefined,
    isrc: r.isrc ?? undefined,
    source: r.source as Track['source'],
    filePath: r.file_path ?? undefined,
    isDownloaded: !!r.file_path,
  }));
}
