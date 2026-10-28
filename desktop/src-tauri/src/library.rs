//! The list of downloaded tracks lives in one JSON file next to the tools.
//! The frontend owns its shape; Rust only stores it and keeps the files it
//! points to playable through the asset protocol.

use serde_json::Value;
use std::path::Path;
use tauri::{AppHandle, Manager};

use crate::paths::{default_music_dir, library_file, stream_cache_dir};

pub fn allow_known_dirs(app: &AppHandle) {
    let scope = app.asset_protocol_scope();
    let _ = scope.allow_directory(default_music_dir(app), true);
    let _ = scope.allow_directory(stream_cache_dir(app), true);
}

pub async fn read(app: &AppHandle) -> Result<Option<Value>, String> {
    let path = library_file(app);
    let text = match tokio::fs::read_to_string(&path).await {
        Ok(t) => t,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(e.to_string()),
    };
    let value: Value = serde_json::from_str(&text).map_err(|e| format!("library.json повреждён: {e}"))?;
    // Downloads may live in a folder the user picked; let the player read them.
    if let Some(items) = value.as_array() {
        let scope = app.asset_protocol_scope();
        for item in items {
            if let Some(p) = item.get("filePath").and_then(Value::as_str) {
                if let Some(parent) = Path::new(p).parent() {
                    let _ = scope.allow_directory(parent, false);
                }
            }
        }
    }
    Ok(Some(value))
}

pub async fn write(app: &AppHandle, tracks: Value) -> Result<(), String> {
    let path = library_file(app);
    if let Some(dir) = path.parent() {
        tokio::fs::create_dir_all(dir).await.map_err(|e| e.to_string())?;
    }
    let tmp = path.with_extension("json.tmp");
    let text = serde_json::to_string(&tracks).map_err(|e| e.to_string())?;
    tokio::fs::write(&tmp, text).await.map_err(|e| e.to_string())?;
    tokio::fs::rename(&tmp, &path).await.map_err(|e| e.to_string())
}

const AUDIO_EXTS: &[&str] = &["m4a", "mp3", "opus", "webm", "ogg", "flac", "aac", "mp4"];

/// Deletes a downloaded audio file; refuses anything that isn't audio.
pub async fn delete_audio(path: &str) -> Result<(), String> {
    let p = Path::new(path);
    let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("").to_ascii_lowercase();
    if !AUDIO_EXTS.contains(&ext.as_str()) {
        return Err("это не аудиофайл".into());
    }
    match tokio::fs::remove_file(p).await {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}
