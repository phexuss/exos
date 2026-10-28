//! Browser cookies for YouTube, read once and reused.
//!
//! `--cookies-from-browser` reopens (and for Chromium browsers decrypts) the
//! whole cookie store on every yt-dlp run, which costs seconds and fails while
//! the browser holds a lock. Instead yt-dlp exports them to a file every
//! half hour, and each run gets its own copy, because yt-dlp writes the file
//! back on exit and two parallel runs would clobber a shared one.

use serde::Serialize;
use std::path::PathBuf;
use std::time::{Duration, SystemTime};
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::paths::{data_dir, work_dir};
use crate::proc;
use crate::tools;

const FRESH_FOR: Duration = Duration::from_secs(30 * 60);
const EXPORT_TIMEOUT: Duration = Duration::from_secs(60);
/// Cookies only a signed-in YouTube/Google session has.
const SIGNED_IN: &[&str] = &["SAPISID", "__Secure-3PAPISID", "LOGIN_INFO", "SID"];

static EXPORT: Mutex<()> = Mutex::const_new(());

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CookieCheck {
    pub count: usize,
    pub youtube: usize,
    pub signed_in: bool,
}

fn file_for(app: &AppHandle, browser: &str) -> PathBuf {
    data_dir(app).join(format!("cookies-{browser}.txt"))
}

fn is_fresh(path: &PathBuf) -> bool {
    std::fs::metadata(path)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| SystemTime::now().duration_since(t).ok())
        .is_some_and(|age| age < FRESH_FOR)
}

/// Has yt-dlp write the browser's cookies to our file. With no URL yt-dlp
/// exits with a usage error, but only after saving the cookie jar.
async fn export(app: &AppHandle, browser: &str) -> Result<PathBuf, String> {
    let _guard = EXPORT.lock().await;
    let dest = file_for(app, browser);
    let ytdlp = tools::ytdlp(app).await.ok_or("yt-dlp не установлен")?;
    let tmp = dest.with_extension("new");
    let _ = tokio::fs::remove_file(&tmp).await;
    tokio::fs::create_dir_all(data_dir(app)).await.map_err(|e| e.to_string())?;
    let tmp_s = tmp.display().to_string();
    let result =
        proc::output(std::path::Path::new(&ytdlp.path), &["--ignore-config", "--cookies-from-browser", browser, "--cookies", &tmp_s], EXPORT_TIMEOUT)
            .await;
    let written = tokio::fs::metadata(&tmp).await.map(|m| m.len() > 0).unwrap_or(false);
    if !written {
        let why = result.err().unwrap_or_default();
        let lower = why.to_lowercase();
        let msg = if lower.contains("at least one url") {
            "yt-dlp не выгрузил куки".into()
        } else if lower.contains("could not find") {
            format!("не нашёл профиль браузера ({browser}). Он установлен и хоть раз запускался?")
        } else if lower.contains("could not copy") || lower.contains("database is locked") {
            "браузер держит куки заблокированными. Закрой его и попробуй снова".into()
        } else if lower.contains("keyring") || lower.contains("secretstorage") || lower.contains("decrypt") {
            "не получилось расшифровать куки (связка ключей). Попробуй Firefox".into()
        } else if why.is_empty() {
            "yt-dlp не выгрузил куки".into()
        } else {
            why
        };
        return Err(msg);
    }
    tokio::fs::rename(&tmp, &dest).await.map_err(|e| e.to_string())?;
    Ok(dest)
}

/// A private copy of fresh cookies for one yt-dlp run, or None when the
/// browser can't be read (the run then goes without cookies).
pub async fn for_run(app: &AppHandle, browser: &str) -> Option<PathBuf> {
    let shared = file_for(app, browser);
    if !is_fresh(&shared) {
        if let Err(e) = export(app, browser).await {
            eprintln!("cookies: {e}");
            if !shared.is_file() {
                return None;
            }
        }
    }
    let dir = work_dir(app);
    tokio::fs::create_dir_all(&dir).await.ok()?;
    let nanos = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap_or_default().as_nanos();
    let copy = dir.join(format!("cookies-{nanos}.txt"));
    tokio::fs::copy(&shared, &copy).await.ok()?;
    Some(copy)
}

/// Re-reads the browser now and says what came out, for the Settings check.
pub async fn check(app: &AppHandle, browser: &str) -> Result<CookieCheck, String> {
    let path = export(app, browser).await?;
    let text = tokio::fs::read_to_string(&path).await.map_err(|e| e.to_string())?;
    let mut count = 0;
    let mut youtube = 0;
    let mut signed_in = false;
    for line in text.lines() {
        let line = line.strip_prefix("#HttpOnly_").unwrap_or(line);
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let cols: Vec<&str> = line.split('\t').collect();
        if cols.len() < 7 {
            continue;
        }
        count += 1;
        let domain = cols[0].trim_start_matches('.');
        if domain == "youtube.com" || domain.ends_with(".youtube.com") {
            youtube += 1;
            if SIGNED_IN.contains(&cols[5]) {
                signed_in = true;
            }
        }
    }
    Ok(CookieCheck { count, youtube, signed_in })
}
