//! Finding, installing and updating the tools the local engine runs on:
//! yt-dlp itself, a JavaScript runtime it uses for YouTube's challenges
//! (Deno by default), and ffmpeg for HLS and format conversion.

use futures_util::StreamExt;
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime};
use tauri::{AppHandle, Emitter};
use tokio::io::AsyncWriteExt;

use crate::paths::{bin_dir, data_dir, default_music_dir, exe};
use crate::proc;

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ToolInfo {
    pub path: String,
    pub version: String,
    /// Installed by EXØS into its own folder (and so updatable by it).
    pub managed: bool,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct JsRuntime {
    pub name: String,
    #[serde(flatten)]
    pub info: ToolInfo,
}

#[derive(Serialize, Clone, Copy)]
pub struct Installable {
    pub ytdlp: bool,
    pub ffmpeg: bool,
    pub deno: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineStatus {
    pub ytdlp: Option<ToolInfo>,
    pub ffmpeg: Option<ToolInfo>,
    pub js_runtime: Option<JsRuntime>,
    pub music_dir: String,
    pub data_dir: String,
    pub installable: Installable,
}

const VERSION_TIMEOUT: Duration = Duration::from_secs(20);

/// GUI apps on macOS start with a bare PATH; Homebrew lives outside it.
fn extra_dirs() -> Vec<PathBuf> {
    let mut dirs = vec![];
    if cfg!(target_os = "macos") {
        dirs.push("/opt/homebrew/bin".into());
        dirs.push("/usr/local/bin".into());
    }
    if cfg!(target_os = "linux") {
        dirs.push("/usr/local/bin".into());
        dirs.push("/usr/bin".into());
    }
    if let Some(home) = std::env::var_os("HOME").or_else(|| std::env::var_os("USERPROFILE")) {
        let home = PathBuf::from(home);
        dirs.push(home.join(".deno/bin"));
        dirs.push(home.join(".bun/bin"));
        dirs.push(home.join(".local/bin"));
    }
    dirs
}

/// Our own copy first, then PATH, then the usual install locations.
fn locate(app: &AppHandle, name: &str) -> Option<(PathBuf, bool)> {
    let managed = bin_dir(app).join(exe(name));
    if managed.is_file() {
        return Some((managed, true));
    }
    if let Ok(p) = which::which(name) {
        return Some((p, false));
    }
    extra_dirs()
        .into_iter()
        .map(|d| d.join(exe(name)))
        .find(|p| p.is_file())
        .map(|p| (p, false))
}

async fn version_of(path: &Path, args: &[&str]) -> Option<String> {
    let out = proc::output(path, args, VERSION_TIMEOUT).await.ok()?;
    let first = out.lines().next()?.trim().to_string();
    Some(first)
}

pub async fn ytdlp(app: &AppHandle) -> Option<ToolInfo> {
    let (path, managed) = locate(app, "yt-dlp")?;
    let version = version_of(&path, &["--version"]).await?;
    Some(ToolInfo { path: path.display().to_string(), version, managed })
}

pub async fn ffmpeg(app: &AppHandle) -> Option<ToolInfo> {
    let (path, managed) = locate(app, "ffmpeg")?;
    let line = version_of(&path, &["-version"]).await?;
    // "ffmpeg version 7.1-full_build-www.gyan.dev Copyright ..."
    let version = line
        .split_whitespace()
        .nth(2)
        .unwrap_or("?")
        .split(['-', '+'])
        .next()
        .unwrap_or("?")
        .to_string();
    Some(ToolInfo { path: path.display().to_string(), version, managed })
}

pub async fn js_runtime(app: &AppHandle) -> Option<JsRuntime> {
    for name in ["deno", "node", "bun"] {
        if let Some((path, managed)) = locate(app, name) {
            if let Some(v) = version_of(&path, &["--version"]).await {
                // deno prints "deno 2.5.4 (stable, ...)", node "v22.1.0", bun "1.2.3".
                let version = v
                    .trim_start_matches("deno ")
                    .trim_start_matches('v')
                    .split_whitespace()
                    .next()
                    .unwrap_or("?")
                    .to_string();
                return Some(JsRuntime {
                    name: name.to_string(),
                    info: ToolInfo { path: path.display().to_string(), version, managed },
                });
            }
        }
    }
    None
}

pub fn installable() -> Installable {
    Installable {
        ytdlp: ytdlp_asset().is_some(),
        deno: deno_target().is_some(),
        ffmpeg: ffmpeg_asset().is_some(),
    }
}

pub async fn status(app: &AppHandle) -> EngineStatus {
    let (ytdlp, ffmpeg, js) = tokio::join!(ytdlp(app), ffmpeg(app), js_runtime(app));
    EngineStatus {
        ytdlp,
        ffmpeg,
        js_runtime: js,
        music_dir: default_music_dir(app).display().to_string(),
        data_dir: data_dir(app).display().to_string(),
        installable: installable(),
    }
}

/* ---------- install ---------- */

fn ytdlp_asset() -> Option<&'static str> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("windows", "x86_64") => Some("yt-dlp.exe"),
        ("windows", "aarch64") => Some("yt-dlp_arm64.exe"),
        ("windows", "x86") => Some("yt-dlp_x86.exe"),
        ("macos", _) => Some("yt-dlp_macos"),
        ("linux", "x86_64") => Some("yt-dlp_linux"),
        ("linux", "aarch64") => Some("yt-dlp_linux_aarch64"),
        _ => None,
    }
}

fn deno_target() -> Option<&'static str> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("windows", "x86_64") => Some("x86_64-pc-windows-msvc"),
        ("macos", "x86_64") => Some("x86_64-apple-darwin"),
        ("macos", "aarch64") => Some("aarch64-apple-darwin"),
        ("linux", "x86_64") => Some("x86_64-unknown-linux-gnu"),
        ("linux", "aarch64") => Some("aarch64-unknown-linux-gnu"),
        _ => None,
    }
}

/// Static ffmpeg builds are published as zips only for Windows (by yt-dlp's
/// own FFmpeg-Builds). Elsewhere the system package manager does a better job.
fn ffmpeg_asset() -> Option<&'static str> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("windows", "x86_64") => Some("ffmpeg-master-latest-win64-gpl.zip"),
        ("windows", "aarch64") => Some("ffmpeg-master-latest-winarm64-gpl.zip"),
        _ => None,
    }
}

#[derive(Serialize, Clone)]
struct InstallProgress<'a> {
    tool: &'a str,
    progress: f64,
}

fn http() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent(concat!("EXOS-desktop/", env!("CARGO_PKG_VERSION")))
        .connect_timeout(Duration::from_secs(20))
        .build()
        .map_err(|e| e.to_string())
}

async fn download_to(app: &AppHandle, tool: &str, url: &str, dest: &Path) -> Result<(), String> {
    let res = http()?
        .get(url)
        .send()
        .await
        .and_then(|r| r.error_for_status())
        .map_err(|e| format!("не скачалось {url}: {e}"))?;
    let total = res.content_length().unwrap_or(0) as f64;
    let mut file = tokio::fs::File::create(dest).await.map_err(|e| e.to_string())?;
    let mut done = 0f64;
    let mut last_emit = 0f64;
    let mut stream = res.bytes_stream();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("обрыв загрузки: {e}"))?;
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
        done += chunk.len() as f64;
        if total > 0.0 && (done - last_emit) / total > 0.01 {
            last_emit = done;
            let _ = app.emit("engine://install-progress", InstallProgress { tool, progress: done / total });
        }
    }
    file.flush().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(unix)]
fn make_executable(path: &Path) -> Result<(), String> {
    use std::os::unix::fs::PermissionsExt;
    std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o755)).map_err(|e| e.to_string())
}

#[cfg(not(unix))]
fn make_executable(_: &Path) -> Result<(), String> {
    Ok(())
}

/// Pulls the named entries (matched by file name, any folder) out of a zip.
fn extract(zip_path: &Path, wanted: &[&str], into: &Path) -> Result<(), String> {
    let file = std::fs::File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
    let mut found = 0;
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        let Some(name) = entry.enclosed_name().and_then(|p| p.file_name().map(|n| n.to_owned())) else {
            continue;
        };
        if !wanted.iter().any(|w| name == *w) {
            continue;
        }
        let dest = into.join(&name);
        let mut out = std::fs::File::create(&dest).map_err(|e| e.to_string())?;
        std::io::copy(&mut entry, &mut out).map_err(|e| e.to_string())?;
        make_executable(&dest)?;
        found += 1;
    }
    if found == 0 {
        return Err(format!("в архиве нет {}", wanted.join(", ")));
    }
    Ok(())
}

pub async fn install(app: &AppHandle, tool: &str) -> Result<(), String> {
    let bin = bin_dir(app);
    tokio::fs::create_dir_all(&bin).await.map_err(|e| e.to_string())?;
    match tool {
        "ytdlp" => {
            let asset = ytdlp_asset().ok_or("под эту систему нет готового yt-dlp")?;
            let url = format!("https://github.com/yt-dlp/yt-dlp/releases/latest/download/{asset}");
            let tmp = bin.join(format!("{}.part", exe("yt-dlp")));
            download_to(app, "ytdlp", &url, &tmp).await?;
            make_executable(&tmp)?;
            tokio::fs::rename(&tmp, bin.join(exe("yt-dlp"))).await.map_err(|e| e.to_string())?;
        }
        "deno" => {
            let target = deno_target().ok_or("под эту систему нет готового Deno")?;
            let url = format!("https://github.com/denoland/deno/releases/latest/download/deno-{target}.zip");
            let tmp = bin.join("deno.zip.part");
            download_to(app, "deno", &url, &tmp).await?;
            let bin2 = bin.clone();
            let tmp2 = tmp.clone();
            tokio::task::spawn_blocking(move || extract(&tmp2, &[&exe("deno")], &bin2))
                .await
                .map_err(|e| e.to_string())??;
            let _ = tokio::fs::remove_file(&tmp).await;
        }
        "ffmpeg" => {
            let asset = ffmpeg_asset()
                .ok_or("ffmpeg ставится через систему: brew install ffmpeg или пакет ffmpeg")?;
            let url = format!("https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/{asset}");
            let tmp = bin.join("ffmpeg.zip.part");
            download_to(app, "ffmpeg", &url, &tmp).await?;
            let bin2 = bin.clone();
            let tmp2 = tmp.clone();
            tokio::task::spawn_blocking(move || extract(&tmp2, &[&exe("ffmpeg"), &exe("ffprobe")], &bin2))
                .await
                .map_err(|e| e.to_string())??;
            let _ = tokio::fs::remove_file(&tmp).await;
        }
        other => return Err(format!("неизвестный инструмент {other}")),
    }
    let _ = app.emit("engine://install-progress", InstallProgress { tool, progress: 1.0 });
    Ok(())
}

/// `yt-dlp -U` for our own copy. A system yt-dlp belongs to its package manager.
pub async fn update_ytdlp(app: &AppHandle) -> Result<String, String> {
    let (path, managed) = locate(app, "yt-dlp").ok_or("yt-dlp не установлен")?;
    if !managed {
        return Err(format!(
            "это системный yt-dlp ({}), обнови его тем же способом, каким ставил",
            path.display()
        ));
    }
    proc::output(&path, &["-U"], Duration::from_secs(120)).await?;
    let _ = std::fs::write(data_dir(app).join("ytdlp-updated"), "");
    version_of(&path, &["--version"]).await.ok_or_else(|| "yt-dlp не запускается".into())
}

/// YouTube breaks old yt-dlp releases every few weeks, so our copy updates
/// itself in the background at most once a day.
pub async fn auto_update(app: AppHandle) {
    let stamp = data_dir(&app).join("ytdlp-updated");
    let fresh = std::fs::metadata(&stamp)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| SystemTime::now().duration_since(t).ok())
        .is_some_and(|age| age < Duration::from_secs(20 * 3600));
    if fresh || !matches!(locate(&app, "yt-dlp"), Some((_, true))) {
        return;
    }
    let _ = update_ytdlp(&app).await;
}
