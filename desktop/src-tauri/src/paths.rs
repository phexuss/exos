//! Where EXØS keeps its own tools, caches and the library index.

use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub fn data_dir(app: &AppHandle) -> PathBuf {
    app.path()
        .app_local_data_dir()
        .unwrap_or_else(|_| std::env::temp_dir().join("exos"))
}

/// yt-dlp, deno and ffmpeg that EXØS downloaded itself.
pub fn bin_dir(app: &AppHandle) -> PathBuf {
    data_dir(app).join("bin")
}

/// Tracks pulled down only to be played (HLS sources, fallbacks).
pub fn stream_cache_dir(app: &AppHandle) -> PathBuf {
    app.path()
        .app_cache_dir()
        .unwrap_or_else(|_| data_dir(app).join("cache"))
        .join("stream")
}

/// Per-download scratch folders; finished files are moved out of here.
pub fn work_dir(app: &AppHandle) -> PathBuf {
    data_dir(app).join("work")
}

pub fn library_file(app: &AppHandle) -> PathBuf {
    data_dir(app).join("library.json")
}

pub fn default_music_dir(app: &AppHandle) -> PathBuf {
    let base = app
        .path()
        .audio_dir()
        .or_else(|_| app.path().home_dir().map(|h| h.join("Music")))
        .unwrap_or_else(|_| data_dir(app));
    base.join("EXØS")
}

pub fn exe(name: &str) -> String {
    if cfg!(windows) {
        format!("{name}.exe")
    } else {
        name.to_string()
    }
}
