//! Resolving and downloading audio with yt-dlp on this computer, so YouTube
//! and SoundCloud see the user's own IP instead of the EXØS server's.
//!
//! Source and format choice mirror apps/api/src/download/download.service.ts
//! so a track resolves to the same upload on the phone and on the desktop.

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::{AsyncBufReadExt, BufReader};

use crate::paths::{stream_cache_dir, work_dir};
use crate::{cookies, media, proc, soundcloud, tools};

/// YouTube's JS challenge alone can take 10-20 s; give the whole run room.
const RESOLVE_TIMEOUT: Duration = Duration::from_secs(90);
const PROGRESS_MARK: &str = "EXOSPROG";
const FILE_MARK: &str = "EXOSFILE";

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SourceRequest {
    pub query: String,
    pub isrc: Option<String>,
    pub cookies_browser: Option<String>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DownloadRequest {
    #[serde(flatten)]
    pub src: SourceRequest,
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: Option<String>,
    pub format: String,
    pub dir: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedStream {
    pub url: String,
    pub protocol: String,
    pub ext: String,
    /// The page the audio came from (the YouTube video a search found), so the
    /// app can skip the search next time.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_url: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Downloaded {
    pub file_path: String,
    pub format: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Progress {
    id: String,
    stage: &'static str,
    progress: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    speed: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    eta: Option<String>,
}

/// Running downloads by track id, so they can be cancelled.
#[derive(Default)]
pub struct Jobs(pub Mutex<HashMap<String, tokio::sync::oneshot::Sender<()>>>);

fn is_http(s: &str) -> bool {
    s.starts_with("http://") || s.starts_with("https://")
}

fn host_of(url: &str) -> String {
    url.split("://")
        .nth(1)
        .unwrap_or("")
        .split(['/', '?', '#'])
        .next()
        .unwrap_or("")
        .rsplit('@')
        .next()
        .unwrap_or("")
        .split(':')
        .next()
        .unwrap_or("")
        .to_ascii_lowercase()
}

fn is_soundcloud(url: &str) -> bool {
    let h = host_of(url);
    h == "soundcloud.com" || h.ends_with(".soundcloud.com")
}

fn is_youtube(url: &str) -> bool {
    let h = host_of(url);
    h == "youtube.com" || h.ends_with(".youtube.com") || h == "youtu.be"
}

fn resolve_source(req: &SourceRequest) -> Result<String, String> {
    let q = req.query.trim();
    if is_http(q) {
        if is_soundcloud(q) || is_youtube(q) {
            return Ok(q.to_string());
        }
        return Err("поддерживаются только ссылки SoundCloud и YouTube".into());
    }
    if let Some(isrc) = req.isrc.as_deref().map(str::trim).filter(|s| s.len() == 12) {
        return Ok(format!("ytsearch1:{isrc}"));
    }
    if q.is_empty() {
        return Err("пустой запрос".into());
    }
    Ok(format!("ytsearch1:{q}"))
}

/// What to fetch for listening: something the webview can play directly.
fn stream_format(source: &str) -> &'static str {
    if is_soundcloud(source) {
        // Progressive mp3 is gone for most tracks; HLS AAC is next best.
        "http_mp3_128_url/bestaudio[protocol^=http][ext=mp3]/bestaudio[protocol^=http]/bestaudio[acodec^=mp4a]/bestaudio[ext=m4a]/bestaudio"
    } else {
        "bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio[protocol^=http]/bestaudio"
    }
}

struct Ctx {
    ytdlp: PathBuf,
    ffmpeg: Option<PathBuf>,
}

async fn ctx(app: &AppHandle) -> Result<Ctx, String> {
    let (ytdlp, ffmpeg) = tokio::join!(tools::ytdlp(app), tools::ffmpeg(app));
    let ytdlp = ytdlp.ok_or("yt-dlp не установлен. Поставь его в Настройках")?;
    Ok(Ctx { ytdlp: ytdlp.path.into(), ffmpeg: ffmpeg.map(|f| f.path.into()) })
}

/// Flags every run shares, plus the cookie copy to delete once the run ends.
struct BaseArgs {
    args: Vec<String>,
    cookie_copy: Option<PathBuf>,
}

impl Drop for BaseArgs {
    fn drop(&mut self) {
        if let Some(p) = self.cookie_copy.take() {
            let _ = std::fs::remove_file(p);
        }
    }
}

/// No user config, our JS runtime, our ffmpeg, cookies.
async fn base_args(app: &AppHandle, ctx: &Ctx, req: &SourceRequest, source: &str) -> BaseArgs {
    let mut args: Vec<String> = vec![
        "--ignore-config".into(),
        "--no-playlist".into(),
        "--no-warnings".into(),
        "--extractor-retries".into(),
        "2".into(),
        "--socket-timeout".into(),
        "20".into(),
        // HLS (SoundCloud) and DASH arrive in small pieces; fetch several at once.
        "--concurrent-fragments".into(),
        "4".into(),
    ];
    if let Some(js) = tools::js_runtime(app).await {
        args.push("--js-runtimes".into());
        args.push(format!("{}:{}", js.name, js.info.path));
    }
    if let Some(ff) = &ctx.ffmpeg {
        args.push("--ffmpeg-location".into());
        args.push(ff.display().to_string());
    }
    let mut cookie_copy = None;
    if let Some(browser) = req.cookies_browser.as_deref().filter(|b| !b.is_empty()) {
        if is_youtube(source) || source.starts_with("ytsearch") {
            if let Some(copy) = cookies::for_run(app, browser).await {
                args.push("--cookies".into());
                args.push(copy.display().to_string());
                cookie_copy = Some(copy);
            }
        }
    }
    BaseArgs { args, cookie_copy }
}

fn friendly(err: String) -> String {
    let lower = err.to_lowercase();
    if lower.contains("sign in to confirm") || lower.contains("not a bot") {
        return "YouTube просит подтвердить, что ты не бот. Выбери браузер в Настройках → Куки браузера для YouTube".into();
    }
    if lower.contains("could not copy") && lower.contains("cookie") {
        return "Не получилось прочитать куки браузера. Закрой браузер и попробуй снова".into();
    }
    if lower.contains("requested format is not available") || lower.contains("only images are available") {
        return "YouTube не отдал аудио. Проверь, что стоит JS-движок (Настройки), и обнови yt-dlp".into();
    }
    if lower.contains("ffmpeg") && lower.contains("not found") {
        return "Для этого трека нужен ffmpeg. Поставь его в Настройках".into();
    }
    err
}

/// SoundCloud straight from its API: a proxied URL for progressive streams,
/// a cached file for HLS.
async fn soundcloud_stream(app: &AppHandle, page: &str) -> Result<ResolvedStream, String> {
    let stream = soundcloud::resolve(app, page).await?;
    if !stream.hls {
        let url = media::remote_url(stream.url, soundcloud::proxy_headers(), stream.ext.into())?;
        return Ok(ResolvedStream { url, protocol: "https".into(), ext: stream.ext.into(), source_url: None });
    }
    let dir = stream_cache_dir(app);
    tokio::fs::create_dir_all(&dir).await.map_err(|e| e.to_string())?;
    let dest = dir.join(format!("{}.{}", hashed(&format!("sc|{page}")), stream.ext));
    if !dest.is_file() {
        soundcloud::fetch_hls(&stream.url, stream.ext, &dest, |_| {}).await?;
    }
    let url = media::file_url(&dest.display().to_string())?;
    Ok(ResolvedStream { url, protocol: "file".into(), ext: stream.ext.into(), source_url: None })
}

pub async fn resolve_stream(app: &AppHandle, req: SourceRequest) -> Result<ResolvedStream, String> {
    let source = resolve_source(&req)?;
    if is_soundcloud(&source) {
        match soundcloud_stream(app, &source).await {
            Ok(s) => return Ok(s),
            Err(e) => eprintln!("soundcloud: {e}; falling back to yt-dlp"),
        }
    }
    let ctx = ctx(app).await?;
    let mut base = base_args(app, &ctx, &req, &source).await;
    base.args.extend([
        "-f".into(),
        stream_format(&source).into(),
        "--print".into(),
        "%(protocol)s\t%(ext)s\t%(http_headers)j\t%(webpage_url)s\t%(url)s".into(),
        source,
    ]);
    let refs: Vec<&str> = base.args.iter().map(String::as_str).collect();
    let out = proc::output(&ctx.ytdlp, &refs, RESOLVE_TIMEOUT).await.map_err(friendly)?;
    let line = out.lines().rev().find(|l| l.contains("\thttp")).ok_or("yt-dlp не вернул ссылку")?;
    let mut parts = line.splitn(5, '\t');
    let protocol = parts.next().unwrap_or("").to_string();
    let ext = parts.next().unwrap_or("").to_string();
    let headers: Vec<(String, String)> = serde_json::from_str::<HashMap<String, String>>(parts.next().unwrap_or("{}"))
        .map(|h| h.into_iter().collect())
        .unwrap_or_default();
    let source_url = Some(parts.next().unwrap_or("").trim().to_string()).filter(|u| is_youtube(u) || is_soundcloud(u));
    let url = parts.next().unwrap_or("").trim().to_string();
    if !is_http(&url) {
        return Err("yt-dlp вернул странную ссылку".into());
    }
    if protocol.starts_with("http") {
        // The CDN may insist on yt-dlp's headers, which <audio> can't send; our
        // loopback server forwards them.
        let url = media::remote_url(url, headers, ext.clone())?;
        return Ok(ResolvedStream { url, protocol, ext, source_url });
    }
    Ok(ResolvedStream { url, protocol, ext, source_url })
}

fn hashed(id: &str) -> String {
    let digest = Sha256::digest(id.as_bytes());
    digest.iter().take(10).map(|b| format!("{b:02x}")).collect()
}

/// Strips characters Windows, macOS or Linux refuse in file names.
fn safe_name(s: &str) -> String {
    let cleaned: String = s
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            c if c.is_control() => '_',
            c => c,
        })
        .collect();
    let trimmed = cleaned.trim().trim_end_matches('.').trim();
    let mut out: String = trimmed.chars().take(150).collect();
    if out.is_empty() {
        out = "track".into();
    }
    out
}

/// A `--parse-metadata` FROM that evaluates to `s` literally. FROM is split on
/// `:` and is a template (so `%` needs doubling), and a bare word would be read
/// as a field name, hence the empty-default field in front.
fn template_literal(s: &str) -> String {
    format!("%(exos_none|)s{}", s.replace('%', "%%").replace(':', "\\:"))
}

struct Run {
    file: PathBuf,
}

/// Runs yt-dlp into a scratch folder, reporting progress, and returns the
/// finished file. Cancel by dropping the sender stored in `Jobs`.
async fn run_download(
    app: &AppHandle,
    id: &str,
    mut args: Vec<String>,
    scratch: &Path,
    cancel: tokio::sync::oneshot::Receiver<()>,
    converts: bool,
) -> Result<Run, String> {
    let ytdlp = ctx(app).await?.ytdlp;
    tokio::fs::create_dir_all(scratch).await.map_err(|e| e.to_string())?;
    args.extend([
        // YouTube throttles long single requests; ask in 10 MB pieces.
        "--http-chunk-size".into(),
        "10M".into(),
        "--newline".into(),
        "--progress".into(),
        "--progress-template".into(),
        format!("download:{PROGRESS_MARK}\t%(progress._percent_str)s\t%(progress._speed_str)s\t%(progress._eta_str)s"),
        "--print".into(),
        format!("after_move:{FILE_MARK}\t%(filepath)s"),
        "-P".into(),
        scratch.display().to_string(),
    ]);

    let emit = |stage: &'static str, progress: f64, speed: Option<String>, eta: Option<String>| {
        let _ = app.emit(
            "download://progress",
            Progress { id: id.to_string(), stage, progress, speed, eta },
        );
    };
    emit("resolving", 0.0, None, None);

    let mut child = proc::command(&ytdlp)
        .args(&args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("не удалось запустить yt-dlp: {e}"))?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();
    let err_task = tokio::spawn(async move {
        let mut lines = BufReader::new(stderr).lines();
        let mut log = String::new();
        while let Ok(Some(l)) = lines.next_line().await {
            log.push_str(&l);
            log.push('\n');
        }
        log
    });

    let mut file: Option<PathBuf> = None;
    let mut lines = BufReader::new(stdout).lines();
    let mut cancel = cancel;
    loop {
        tokio::select! {
            _ = &mut cancel => {
                let _ = child.kill().await;
                return Err("отменено".into());
            }
            line = lines.next_line() => {
                let Ok(Some(line)) = line else { break };
                if let Some(rest) = line.strip_prefix(&format!("{PROGRESS_MARK}\t")) {
                    let mut p = rest.split('\t');
                    let pct = p.next().unwrap_or("").trim().trim_end_matches('%').parse::<f64>().unwrap_or(0.0) / 100.0;
                    let speed = p.next().map(|s| s.trim().to_string()).filter(|s| !s.is_empty() && s != "Unknown" && s != "N/A");
                    let eta = p.next().map(|s| s.trim().to_string()).filter(|s| !s.is_empty() && s != "Unknown" && s != "N/A");
                    if pct >= 1.0 && converts {
                        emit("converting", 1.0, None, None);
                    } else {
                        emit("downloading", pct.min(1.0), speed, eta);
                    }
                } else if let Some(path) = line.strip_prefix(&format!("{FILE_MARK}\t")) {
                    file = Some(PathBuf::from(path.trim()));
                }
            }
        }
    }

    let status = child.wait().await.map_err(|e| e.to_string())?;
    let log = err_task.await.unwrap_or_default();
    if !status.success() {
        return Err(friendly(proc::last_error_line(&log)));
    }
    let file = file
        .filter(|f| f.is_file())
        .ok_or_else(|| friendly(format!("yt-dlp закончил без файла. {}", proc::last_error_line(&log))))?;
    Ok(Run { file })
}

fn register(app: &AppHandle, id: &str) -> tokio::sync::oneshot::Receiver<()> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    if let Some(jobs) = app.try_state::<Jobs>() {
        jobs.0.lock().unwrap().insert(id.to_string(), tx);
    }
    rx
}

fn unregister(app: &AppHandle, id: &str) {
    if let Some(jobs) = app.try_state::<Jobs>() {
        jobs.0.lock().unwrap().remove(id);
    }
}

pub fn cancel(app: &AppHandle, id: &str) {
    if let Some(jobs) = app.try_state::<Jobs>() {
        if let Some(tx) = jobs.0.lock().unwrap().remove(id) {
            let _ = tx.send(());
        }
    }
}

/// Downloads a track for listening only (HLS sources, refused direct URLs).
pub async fn cache_track(app: &AppHandle, id: &str, req: SourceRequest) -> Result<String, String> {
    let dir = stream_cache_dir(app);
    let key = hashed(&format!("{id}|{}", req.query));
    if let Ok(mut entries) = tokio::fs::read_dir(&dir).await {
        while let Ok(Some(e)) = entries.next_entry().await {
            if e.file_name().to_string_lossy().starts_with(&format!("{key}.")) {
                return Ok(e.path().display().to_string());
            }
        }
    }
    let ctx = ctx(app).await?;
    let source = resolve_source(&req)?;
    let base = base_args(app, &ctx, &req, &source).await;
    let mut args = base.args.clone();
    args.extend(["-f".into(), stream_format(&source).into(), "-o".into(), format!("{key}.%(ext)s")]);
    args.push(source);

    let scratch = work_dir(app).join(format!("cache-{key}"));
    let cache_id = format!("cache:{id}");
    let rx = register(app, &cache_id);
    let result = run_download(app, &cache_id, args, &scratch, rx, false).await;
    unregister(app, &cache_id);
    let run = match result {
        Ok(r) => r,
        Err(e) => {
            let _ = tokio::fs::remove_dir_all(&scratch).await;
            return Err(e);
        }
    };
    tokio::fs::create_dir_all(&dir).await.map_err(|e| e.to_string())?;
    let dest = dir.join(run.file.file_name().unwrap());
    move_file(&run.file, &dest).await?;
    let _ = tokio::fs::remove_dir_all(&scratch).await;
    allow_file(app, &dest);
    Ok(dest.display().to_string())
}

async fn move_file(from: &Path, to: &Path) -> Result<(), String> {
    if tokio::fs::rename(from, to).await.is_ok() {
        return Ok(());
    }
    // Different drive: copy, then remove.
    tokio::fs::copy(from, to).await.map_err(|e| format!("не удалось сохранить файл: {e}"))?;
    let _ = tokio::fs::remove_file(from).await;
    Ok(())
}

fn free_path(dir: &Path, stem: &str, ext: &str) -> PathBuf {
    let first = dir.join(format!("{stem}.{ext}"));
    if !first.exists() {
        return first;
    }
    (2..1000)
        .map(|n| dir.join(format!("{stem} ({n}).{ext}")))
        .find(|p| !p.exists())
        .unwrap_or(first)
}

pub fn allow_file(app: &AppHandle, path: &Path) {
    if let Some(parent) = path.parent() {
        let _ = app.asset_protocol_scope().allow_directory(parent, false);
    }
}

/// Tags (and if asked, re-encodes) a file with ffmpeg, writing `out`.
async fn ffmpeg_finish(ffmpeg: &Path, input: &Path, out: &Path, req: &DownloadRequest, to_mp3: bool) -> Result<(), String> {
    let mut args: Vec<String> = vec![
        "-hide_banner".into(),
        "-loglevel".into(),
        "error".into(),
        "-y".into(),
        "-i".into(),
        input.display().to_string(),
        "-map".into(),
        "0:a".into(),
        "-map_metadata".into(),
        "-1".into(),
    ];
    if to_mp3 {
        args.extend(["-c:a".into(), "libmp3lame".into(), "-q:a".into(), "0".into()]);
    } else {
        args.extend(["-c:a".into(), "copy".into()]);
    }
    for (key, value) in [("title", Some(req.title.as_str())), ("artist", Some(req.artist.as_str())), ("album", req.album.as_deref())] {
        if let Some(v) = value.filter(|v| !v.trim().is_empty()) {
            args.push("-metadata".into());
            args.push(format!("{key}={v}"));
        }
    }
    if out.extension().is_some_and(|e| e == "m4a") {
        args.extend(["-movflags".into(), "+faststart".into()]);
    }
    args.push(out.display().to_string());
    let refs: Vec<&str> = args.iter().map(String::as_str).collect();
    proc::output(ffmpeg, &refs, Duration::from_secs(300)).await.map(|_| ())
}

/// SoundCloud download straight from its API; the caller falls back to yt-dlp on error.
async fn soundcloud_download(
    app: &AppHandle,
    req: &DownloadRequest,
    page: &str,
    ffmpeg: Option<&Path>,
    scratch: &Path,
    cancel: &mut tokio::sync::oneshot::Receiver<()>,
) -> Result<PathBuf, String> {
    let emit = |stage: &'static str, progress: f64| {
        let _ = app.emit("download://progress", Progress { id: req.id.clone(), stage, progress, speed: None, eta: None });
    };
    emit("resolving", 0.0);
    let work = async {
        let stream = soundcloud::resolve(app, page).await?;
        tokio::fs::create_dir_all(scratch).await.map_err(|e| e.to_string())?;
        let raw = scratch.join(format!("raw.{}", stream.ext));
        let progress = |f: f64| emit("downloading", f.min(1.0));
        if stream.hls {
            soundcloud::fetch_hls(&stream.url, stream.ext, &raw, progress).await?;
        } else {
            soundcloud::fetch_progressive(&stream.url, &raw, progress).await?;
        }
        let Some(ffmpeg) = ffmpeg else { return Ok(raw) };
        let to_mp3 = req.format == "mp3" && stream.ext != "mp3";
        let out = scratch.join(format!("track.{}", if to_mp3 { "mp3" } else { stream.ext }));
        emit("converting", 1.0);
        match ffmpeg_finish(ffmpeg, &raw, &out, req, to_mp3).await {
            Ok(()) => Ok(out),
            // Untagged is better than nothing.
            Err(e) if !to_mp3 => {
                eprintln!("ffmpeg tagging failed: {e}");
                Ok(raw)
            }
            Err(e) => Err(e),
        }
    };
    tokio::select! {
        r = work => r,
        _ = cancel => Err("отменено".into()),
    }
}

pub async fn download_track(app: &AppHandle, req: DownloadRequest) -> Result<Downloaded, String> {
    let ctx = ctx(app).await?;
    let source = resolve_source(&req.src)?;
    let soundcloud = is_soundcloud(&source);
    if soundcloud {
        let scratch = work_dir(app).join(format!("sc-{}", hashed(&req.id)));
        let _ = tokio::fs::remove_dir_all(&scratch).await;
        let mut rx = register(app, &req.id);
        let result = soundcloud_download(app, &req, &source, ctx.ffmpeg.as_deref(), &scratch, &mut rx).await;
        unregister(app, &req.id);
        match result {
            Ok(file) => {
                let done = finish_download(app, &req, &file).await;
                let _ = tokio::fs::remove_dir_all(&scratch).await;
                return done;
            }
            Err(e) if e == "отменено" => {
                let _ = tokio::fs::remove_dir_all(&scratch).await;
                return Err(e);
            }
            Err(e) => {
                let _ = tokio::fs::remove_dir_all(&scratch).await;
                eprintln!("soundcloud: {e}; falling back to yt-dlp");
            }
        }
    }
    let has_ffmpeg = ctx.ffmpeg.is_some();
    let want_mp3 = req.format == "mp3";
    if want_mp3 && !has_ffmpeg && !soundcloud {
        return Err("Для MP3 нужен ffmpeg. Поставь его в Настройках или выбери M4A".into());
    }

    let base = base_args(app, &ctx, &req.src, &source).await;
    let mut args = base.args.clone();
    let format = if soundcloud {
        stream_format(&source)
    } else if has_ffmpeg {
        "bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio"
    } else {
        // No ffmpeg: take a single file that already plays everywhere.
        "bestaudio[ext=m4a]/bestaudio[acodec^=mp4a][protocol^=http]/bestaudio[protocol^=http]"
    };
    args.extend(["-f".into(), format.into(), "-o".into(), "track.%(ext)s".into()]);

    let mut converts = false;
    if has_ffmpeg {
        // Copies AAC as-is into m4a; re-encodes only when the source differs.
        let target = if want_mp3 || soundcloud { "mp3" } else { "m4a" };
        args.extend(["-x".into(), "--audio-format".into(), target.into()]);
        if target == "mp3" {
            args.extend(["--audio-quality".into(), "0".into()]);
        }
        converts = true;
        // Tag the file with the Deezer/SoundCloud metadata, not YouTube's video title.
        args.push("--embed-metadata".into());
        for (value, field) in [
            (Some(req.title.as_str()), "meta_title"),
            (Some(req.artist.as_str()), "meta_artist"),
            (req.album.as_deref(), "meta_album"),
        ] {
            if let Some(v) = value.filter(|v| !v.trim().is_empty()) {
                args.push("--parse-metadata".into());
                args.push(format!("{}:%({field})s", template_literal(v)));
            }
        }
        for field in ["meta_description", "meta_synopsis", "meta_comment", "meta_purl"] {
            args.push("--parse-metadata".into());
            args.push(format!(":(?P<{field}>)"));
        }
    }
    args.push(source);

    let scratch = work_dir(app).join(hashed(&req.id));
    let _ = tokio::fs::remove_dir_all(&scratch).await;
    let rx = register(app, &req.id);
    let result = run_download(app, &req.id, args, &scratch, rx, converts).await;
    unregister(app, &req.id);
    let run = match result {
        Ok(r) => r,
        Err(e) => {
            let _ = tokio::fs::remove_dir_all(&scratch).await;
            return Err(e);
        }
    };

    let done = finish_download(app, &req, &run.file).await;
    let _ = tokio::fs::remove_dir_all(&scratch).await;
    done
}

/// Moves a finished file into the music folder as "Artist - Title.ext".
async fn finish_download(app: &AppHandle, req: &DownloadRequest, file: &Path) -> Result<Downloaded, String> {
    let dir = PathBuf::from(&req.dir);
    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|e| format!("не удалось создать папку {}: {e}", dir.display()))?;
    let ext = file
        .extension()
        .map(|e| e.to_string_lossy().to_string())
        .unwrap_or_else(|| "m4a".into());
    let dest = free_path(&dir, &safe_name(&format!("{} - {}", req.artist, req.title)), &ext);
    move_file(file, &dest).await?;
    allow_file(app, &dest);
    let _ = app.emit(
        "download://progress",
        Progress { id: req.id.clone(), stage: "done", progress: 1.0, speed: None, eta: None },
    );
    Ok(Downloaded { file_path: dest.display().to_string(), format: ext })
}
