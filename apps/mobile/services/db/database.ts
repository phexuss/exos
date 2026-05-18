import * as SQLite from 'expo-sqlite';

import type { Track } from '@/types/domain';

let db: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function openDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise = SQLite.openDatabaseAsync('exos.db')
    .then(async (database) => {
      await migrate(database);
      db = database;
      return database;
    })
    .catch((e) => {
      db = null;
      dbPromise = null;
      throw e;
    });
  return dbPromise;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return Promise.resolve(db);
  if (!dbPromise) return openDb();
  return dbPromise;
}

export function resetDb(): void {
  db = null;
  dbPromise = null;
}

export async function withDb<T>(
  fn: (database: SQLite.SQLiteDatabase) => Promise<T>,
): Promise<T> {
  try {
    const database = await getDb();
    return await fn(database);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '';
    if (
      message.includes('NullPointerException') ||
      message.includes('NativeDatabase')
    ) {
      if (__DEV__) console.warn('[DB] Handle corrupted, resetting…');
      resetDb();
      const database = await getDb();
      return fn(database);
    }
    throw e;
  }
}

export function clearLocalDatabase(): Promise<void> {
  return withDb(async (database) => {
    await database.runAsync('DELETE FROM playlist_tracks');
    await database.runAsync('DELETE FROM playlists');
    await database.runAsync('DELETE FROM tracks');
    await database.runAsync('DELETE FROM recently_played');
    try {
      await database.runAsync('VACUUM');
    } catch (e) {
      if (__DEV__) console.warn('[DB] VACUUM skipped:', e);
    }
  });
}

async function ensureColumn(
  database: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  const cols = await database.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`,
  );
  if (cols.some((c) => c.name === column)) return;
  await database.runAsync(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
}

async function migrate(database: SQLite.SQLiteDatabase) {
  await database.runAsync('PRAGMA journal_mode = WAL');
  await database.runAsync('PRAGMA synchronous = NORMAL');

  await database.runAsync(
    `CREATE TABLE IF NOT EXISTS tracks (
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
     )`,
  );

  await database.runAsync(
    `CREATE TABLE IF NOT EXISTS playlists (
       id         TEXT PRIMARY KEY,
       name       TEXT NOT NULL,
       cover_url  TEXT,
       created_at INTEGER NOT NULL
     )`,
  );

  await database.runAsync(
    `CREATE TABLE IF NOT EXISTS playlist_tracks (
       playlist_id  TEXT NOT NULL,
       track_id     TEXT NOT NULL,
       position     INTEGER,
       PRIMARY KEY (playlist_id, track_id)
     )`,
  );

  await database.runAsync(
    `CREATE TABLE IF NOT EXISTS recently_played (
       track_id     TEXT PRIMARY KEY,
       title        TEXT NOT NULL,
       artist       TEXT NOT NULL,
       artist_id    TEXT,
       album        TEXT,
       cover_url    TEXT,
       duration     TEXT NOT NULL,
       duration_sec INTEGER NOT NULL DEFAULT 0,
       preview_url  TEXT,
       isrc         TEXT,
       source       TEXT NOT NULL DEFAULT 'deezer',
       played_at    INTEGER NOT NULL
     )`,
  );

  await ensureColumn(database, 'tracks', 'artist_id', 'artist_id TEXT');
  await ensureColumn(
    database,
    'tracks',
    'duration_sec',
    'duration_sec INTEGER NOT NULL DEFAULT 0',
  );
  await ensureColumn(
    database,
    'tracks',
    'file_format',
    "file_format TEXT DEFAULT 'mp3'",
  );
  await ensureColumn(database, 'tracks', 'isrc', 'isrc TEXT');
  await ensureColumn(database, 'tracks', 'preview_url', 'preview_url TEXT');
  await ensureColumn(database, 'tracks', 'synced_lyrics', 'synced_lyrics TEXT');
  await ensureColumn(database, 'tracks', 'plain_lyrics', 'plain_lyrics TEXT');
  await ensureColumn(
    database,
    'tracks',
    'source',
    "source TEXT DEFAULT 'deezer'",
  );

  await ensureColumn(database, 'playlists', 'cover_url', 'cover_url TEXT');
  await ensureColumn(
    database,
    'playlists',
    'created_at',
    'created_at INTEGER NOT NULL DEFAULT 0',
  );

  await ensureColumn(
    database,
    'playlist_tracks',
    'position',
    'position INTEGER',
  );

  await ensureColumn(
    database,
    'recently_played',
    'artist_id',
    'artist_id TEXT',
  );
  await ensureColumn(database, 'recently_played', 'album', 'album TEXT');
  await ensureColumn(
    database,
    'recently_played',
    'cover_url',
    'cover_url TEXT',
  );
  await ensureColumn(
    database,
    'recently_played',
    'duration_sec',
    'duration_sec INTEGER NOT NULL DEFAULT 0',
  );
  await ensureColumn(
    database,
    'recently_played',
    'preview_url',
    'preview_url TEXT',
  );
  await ensureColumn(database, 'recently_played', 'isrc', 'isrc TEXT');
  await ensureColumn(
    database,
    'recently_played',
    'source',
    "source TEXT NOT NULL DEFAULT 'deezer'",
  );
}

export type LyricsData = {
  syncedLyrics: string | null;
  plainLyrics: string | null;
};

export type DownloadedTrackInfo = LyricsData & {
  filePath: string;
};

export function insertDownloadedTrack(
  track: Track,
  filePath: string,
  fileFormat = 'webm',
  lyrics?: LyricsData | null,
): Promise<void> {
  return withDb(async (database) => {
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
  });
}

export async function getDownloadedTracks(): Promise<Track[]> {
  return withDb(async (database) => {
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
      downloaded_at: number;
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
      downloadedAt: r.downloaded_at,
      source: (r.source as Track['source']) ?? 'deezer',
    }));
  });
}

export function isTrackDownloaded(trackId: string): Promise<boolean> {
  return withDb(async (database) => {
    const row = await database.getFirstAsync<{ id: string }>(
      'SELECT id FROM tracks WHERE id = ?',
      trackId,
    );
    return !!row;
  });
}

export function getDownloadedTrack(
  trackId: string,
): Promise<DownloadedTrackInfo | null> {
  return withDb((database) =>
    database.getFirstAsync<DownloadedTrackInfo>(
      `SELECT
        file_path as filePath,
        synced_lyrics as syncedLyrics,
        plain_lyrics as plainLyrics
       FROM tracks
       WHERE id = ?`,
      trackId,
    ),
  );
}

export function deleteDownloadedTrack(trackId: string): Promise<void> {
  return withDb(async (database) => {
    await database.runAsync('DELETE FROM tracks WHERE id = ?', trackId);
    await database.runAsync(
      'DELETE FROM playlist_tracks WHERE track_id = ?',
      trackId,
    );
  });
}

export type PlaylistRow = {
  id: string;
  name: string;
  cover_url: string | null;
  created_at: number;
  track_count: number;
};

export function createPlaylist(
  name: string,
  coverUrl?: string,
): Promise<string> {
  return withDb(async (database) => {
    const id = `pl-${Date.now()}`;
    await database.runAsync(
      'INSERT INTO playlists (id, name, cover_url, created_at) VALUES (?, ?, ?, ?)',
      id,
      name,
      coverUrl ?? null,
      Date.now(),
    );
    return id;
  });
}

export function getPlaylists(): Promise<PlaylistRow[]> {
  return withDb((database) =>
    database.getAllAsync<PlaylistRow>(`
      SELECT p.*, COUNT(pt.track_id) as track_count
      FROM playlists p
      LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `),
  );
}

export function deletePlaylist(playlistId: string): Promise<void> {
  return withDb(async (database) => {
    await database.runAsync('DELETE FROM playlists WHERE id = ?', playlistId);
    await database.runAsync(
      'DELETE FROM playlist_tracks WHERE playlist_id = ?',
      playlistId,
    );
  });
}

export function renamePlaylist(
  playlistId: string,
  name: string,
): Promise<void> {
  return withDb(async (database) => {
    await database.runAsync(
      'UPDATE playlists SET name = ? WHERE id = ?',
      name,
      playlistId,
    );
  });
}

export function updatePlaylistCover(
  playlistId: string,
  coverUrl: string | null,
): Promise<void> {
  return withDb(async (database) => {
    await database.runAsync(
      'UPDATE playlists SET cover_url = ? WHERE id = ?',
      coverUrl,
      playlistId,
    );
  });
}

export function addTrackToPlaylist(
  playlistId: string,
  trackId: string,
): Promise<void> {
  return withDb(async (database) => {
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
  });
}

export function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string,
): Promise<void> {
  return withDb(async (database) => {
    await database.runAsync(
      'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
      playlistId,
      trackId,
    );
  });
}

export async function getPlaylistTracks(playlistId: string): Promise<Track[]> {
  return withDb(async (database) => {
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
    }>(
      `
    SELECT t.* FROM tracks t
    JOIN playlist_tracks pt ON t.id = pt.track_id
    WHERE pt.playlist_id = ?
    ORDER BY pt.position
  `,
      playlistId,
    );

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
  });
}

export function insertRecentlyPlayed(
  track: Track,
  playedAt = Date.now(),
): Promise<void> {
  return withDb(async (database) => {
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
      playedAt,
    );
  });
}

export function addRecentlyPlayed(track: Track): Promise<void> {
  return insertRecentlyPlayed(track);
}

export async function getRecentlyPlayed(limit = 20): Promise<Track[]> {
  return withDb(async (database) => {
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
      synced_lyrics: string | null;
      plain_lyrics: string | null;
      played_at: number;
    }>(
      `SELECT rp.*, t.file_path, t.synced_lyrics, t.plain_lyrics
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
      playedAt: r.played_at,
      syncedLyrics: r.synced_lyrics ?? undefined,
      plainLyrics: r.plain_lyrics ?? undefined,
    }));
  });
}
