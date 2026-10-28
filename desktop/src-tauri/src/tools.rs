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

/// Where the unpacked ("onedir") yt-dlp build lives: the executable plus its
/// `_internal` folder. It starts several times faster than the single-file
/// build, which unpacks a whole Python runtime to a temp folder on every run.
fn ytdlp_dist_dir(app: &AppHandle) -> PathBuf {
    bin_dir(app).join("yt-dlp-dist")
}

fn ytdlp_in_dist(dir: &Path) -> Option<PathBuf> {
    std::fs::read_dir(dir).ok()?.flatten().map(|e| e.path()).find(|p| {
        p.is_file()
            && p.file_name().and_then(|n| n.to_str()).is_some_and(|n| {
                n.starts_with("yt-dlp") && (!cfg!(windows) || n.ends_with(".exe"))
            })
    })
}

/// Our own copy first, then PATH, then the usual install locations.
fn locate(app: &AppHandle, name: &str) -> Option<(PathBuf, bool)> {
    if name == "yt-dlp" {
        if let Some(p) = ytdlp_in_dist(&ytdlp_dist_dir(app)) {
            return Some((p, true));
        }
    }
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

/// Version lines by binary path and modification time. Asking a PyInstaller
/// yt-dlp for its version costs a second or more, and every play and download
/// looks the tools up; a reinstall or update changes the mtime and so re-asks.
static VERSIONS: std::sync::Mutex<Vec<(PathBuf, SystemTime, String)>> = std::sync::Mutex::new(Vec::new());

async fn version_of(path: &Path, args: &[&str]) -> Option<String> {
    let mtime = std::fs::metadata(path).and_then(|m| m.modified()).ok();
    if let Some(mtime) = mtime {
        let cache = VERSIONS.lock().unwrap();
        if let Some((_, _, v)) = cache.iter().find(|(p, t, _)| p == path && *t == mtime) {
            return Some(v.clone());
        }
    }
    let out = proc::output(path, args, VERSION_TIMEOUT).await.ok()?;
    let first = out.lines().next()?.trim().to_string();
    if let Some(mtime) = mtime {
        let mut cache = VERSIONS.lock().unwrap();
        cache.retain(|(p, _, _)| p != path);
        cache.push((path.to_path_buf(), mtime, first.clone()));
    }
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

/// The unpacked builds; see `ytdlp_dist_dir`.
fn ytdlp_asset() -> Option<&'static str> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("windows", "x86_64") => Some("yt-dlp_win.zip"),
        ("windows", "aarch64") => Some("yt-dlp_win_arm64.zip"),
        ("windows", "x86") => Some("yt-dlp_win_x86.zip"),
        ("macos", _) => Some("yt-dlp_macos.zip"),
        ("linux", "x86_64") => Some("yt-dlp_linux.zip"),
        ("linux", "aarch64") => Some("yt-dlp_linux_aarch64.zip"),
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

/// Unpacks a whole archive into `into`, keeping folders and exec bits.
fn extract_all(zip_path: &Path, into: &Path) -> Result<(), String> {
    let file = std::fs::File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        let Some(rel) = entry.enclosed_name() else { continue };
        let dest = into.join(rel);
        if entry.is_dir() {
            std::fs::create_dir_all(&dest).map_err(|e| e.to_string())?;
            continue;
        }
        if let Some(parent) = dest.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let mut out = std::fs::File::create(&dest).map_err(|e| e.to_string())?;
        std::io::copy(&mut entry, &mut out).map_err(|e| e.to_string())?;
        #[cfg(unix)]
        if let Some(mode) = entry.unix_mode() {
            use std::os::unix::fs::PermissionsExt;
            let _ = std::fs::set_permissions(&dest, std::fs::Permissions::from_mode(mode & 0o7777));
        }
    }
    Ok(())
}

async fn install_ytdlp(app: &AppHandle) -> Result<(), String> {
    let bin = bin_dir(app);
    let asset = ytdlp_asset().ok_or("под эту систему нет готового yt-dlp")?;
    let url = format!("https://github.com/yt-dlp/yt-dlp/releases/latest/download/{asset}");
    let tmp = bin.join("yt-dlp.zip.part");
    download_to(app, "ytdlp", &url, &tmp).await?;
    let dist = ytdlp_dist_dir(app);
    let fresh = bin.join("yt-dlp-dist.new");
    let old = bin.join("yt-dlp-dist.old");
    let _ = tokio::fs::remove_dir_all(&fresh).await;
    let (zip2, fresh2) = (tmp.clone(), fresh.clone());
    let unpacked = tokio::task::spawn_blocking(move || extract_all(&zip2, &fresh2)).await.map_err(|e| e.to_string())?;
    let _ = tokio::fs::remove_file(&tmp).await;
    unpacked?;
    let main = ytdlp_in_dist(&fresh).ok_or("в архиве yt-dlp нет исполняемого файла")?;
    make_executable(&main)?;
    // Swap folders. On Windows this fails while a yt-dlp from the old folder
    // is running; the old one then stays and the next start tries again.
    let _ = tokio::fs::remove_dir_all(&old).await;
    if dist.exists() {
        tokio::fs::rename(&dist, &old).await.map_err(|e| format!("yt-dlp сейчас занят, обновлю позже: {e}"))?;
    }
    tokio::fs::rename(&fresh, &dist).await.map_err(|e| e.to_string())?;
    let _ = tokio::fs::remove_dir_all(&old).await;
    // The single-file build from earlier versions of EXØS.
    let _ = tokio::fs::remove_file(bin.join(exe("yt-dlp"))).await;
    let _ = std::fs::write(data_dir(app).join("ytdlp-updated"), "");
    Ok(())
}

/// The newest release tag, read from GitHub's redirect without the API.
async fn latest_ytdlp_tag() -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent(concat!("EXOS-desktop/", env!("CARGO_PKG_VERSION")))
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(20))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client
        .get("https://github.com/yt-dlp/yt-dlp/releases/latest")
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let location = resp
        .headers()
        .get("location")
        .and_then(|v| v.to_str().ok())
        .ok_or("GitHub не ответил редиректом")?;
    location.rsplit('/').next().map(str::to_string).filter(|t| !t.is_empty()).ok_or_else(|| "нет тега".into())
}

pub async fn install(app: &AppHandle, tool: &str) -> Result<(), String> {
    let bin = bin_dir(app);
    tokio::fs::create_dir_all(&bin).await.map_err(|e| e.to_string())?;
    match tool {
        "ytdlp" => install_ytdlp(app).await?,
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

/// Updates our own copy to the latest release. A system yt-dlp belongs to its
/// package manager. The single-file build of earlier versions is replaced by
/// the faster unpacked one.
pub async fn update_ytdlp(app: &AppHandle) -> Result<String, String> {
    let (path, managed) = locate(app, "yt-dlp").ok_or("yt-dlp не установлен")?;
    if !managed {
        return Err(format!(
            "это системный yt-dlp ({}), обнови его тем же способом, каким ставил",
            path.display()
        ));
    }
    let unpacked = path.starts_with(ytdlp_dist_dir(app));
    let current = version_of(&path, &["--version"]).await;
    if unpacked {
        let latest = latest_ytdlp_tag().await?;
        if current.as_deref() == Some(latest.as_str()) {
            let _ = std::fs::write(data_dir(app).join("ytdlp-updated"), "");
            return Ok(latest);
        }
    }
    install_ytdlp(app).await?;
    let (path, _) = locate(app, "yt-dlp").ok_or("yt-dlp не установился")?;
    version_of(&path, &["--version"]).await.ok_or_else(|| "yt-dlp не запускается".into())
}

/// YouTube breaks old yt-dlp releases every few weeks, so our copy updates
/// itself in the background at most once a day. A single-file copy left by an
/// earlier version is swapped for the unpacked build right away.
pub async fn auto_update(app: AppHandle) {
    let Some((path, true)) = locate(&app, "yt-dlp") else { return };
    let legacy = !path.starts_with(ytdlp_dist_dir(&app));
    let stamp = data_dir(&app).join("ytdlp-updated");
    let fresh = std::fs::metadata(&stamp)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| SystemTime::now().duration_since(t).ok())
        .is_some_and(|age| age < Duration::from_secs(20 * 3600));
    if fresh && !legacy {
        return;
    }
    if let Err(e) = update_ytdlp(&app).await {
        eprintln!("yt-dlp update: {e}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn unpacks_the_onedir_build_and_finds_its_executable() {
        let root = std::env::temp_dir().join(format!("exos-tools-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&root).unwrap();
        let zip_path = root.join("yt.zip");
        let main = if cfg!(windows) { "yt-dlp.exe" } else { "yt-dlp_linux" };
        {
            let mut w = zip::ZipWriter::new(std::fs::File::create(&zip_path).unwrap());
            let exec = zip::write::SimpleFileOptions::default().unix_permissions(0o755);
            w.add_directory("_internal/", exec).unwrap();
            w.start_file("_internal/base_library.zip", zip::write::SimpleFileOptions::default()).unwrap();
            w.write_all(b"lib").unwrap();
            w.start_file(main, exec).unwrap();
            w.write_all(b"bin").unwrap();
            w.finish().unwrap();
        }
        let dist = root.join("dist");
        extract_all(&zip_path, &dist).unwrap();
        assert_eq!(std::fs::read(dist.join("_internal/base_library.zip")).unwrap(), b"lib");
        assert_eq!(ytdlp_in_dist(&dist), Some(dist.join(main)));
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            assert_eq!(std::fs::metadata(dist.join(main)).unwrap().permissions().mode() & 0o777, 0o755);
        }
        std::fs::remove_dir_all(&root).unwrap();
    }
}
