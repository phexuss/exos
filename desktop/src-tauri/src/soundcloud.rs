//! SoundCloud without yt-dlp.
//!
//! yt-dlp spends seconds per SoundCloud track: it starts a Python runtime and
//! asks the API for every transcoding in turn. We need one playable stream, so
//! we ask SoundCloud's web API directly: resolve the page URL, pick the best
//! transcoding the webview can play, and fetch its signed URL. Two requests.
//!
//! Progressive (plain HTTP) streams are handed to the loopback proxy as-is.
//! HLS streams whose pieces simply concatenate into a playable file (MP3
//! chunks, or fragmented MP4 with an init segment) are fetched in parallel and
//! joined. Anything else (Opus, encrypted, byte ranges) returns an error and
//! the caller falls back to yt-dlp.

use futures_util::{stream, StreamExt, TryStreamExt};
use serde::Deserialize;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use std::time::Duration;
use tauri::AppHandle;
use tokio::io::AsyncWriteExt;
use tokio::sync::Mutex;

use crate::paths::data_dir;

const API: &str = "https://api-v2.soundcloud.com";
const UA: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const SEGMENT_PARALLEL: usize = 8;

fn client() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .user_agent(UA)
            .connect_timeout(Duration::from_secs(10))
            .timeout(Duration::from_secs(60))
            .build()
            .expect("http client")
    })
}

/* ---------- client_id ---------- */

static CLIENT_ID: Mutex<Option<String>> = Mutex::const_new(None);

fn id_file(app: &AppHandle) -> PathBuf {
    data_dir(app).join("soundcloud-client-id")
}

fn find_client_id(js: &str) -> Option<String> {
    let mut rest = js;
    while let Some(i) = rest.find("client_id") {
        rest = &rest[i + "client_id".len()..];
        let after = rest.trim_start();
        let Some(after) = after.strip_prefix(':').or_else(|| after.strip_prefix('=')) else { continue };
        let after = after.trim_start();
        let Some(after) = after.strip_prefix('"') else { continue };
        let id: String = after.chars().take_while(|c| c.is_ascii_alphanumeric()).collect();
        if id.len() == 32 && after[32..].starts_with('"') {
            return Some(id);
        }
    }
    None
}

/// The public web client's id, scraped from soundcloud.com's JS bundles.
async fn scrape_client_id() -> Result<String, String> {
    let html = client()
        .get("https://soundcloud.com/")
        .send()
        .await
        .and_then(|r| r.error_for_status())
        .map_err(|e| format!("soundcloud.com не открылся: {e}"))?
        .text()
        .await
        .map_err(|e| e.to_string())?;
    let mut scripts = vec![];
    for part in html.split("<script").skip(1) {
        if let Some(src) = part.split("src=\"").nth(1).and_then(|s| s.split('"').next()) {
            if src.starts_with("https://") && src.ends_with(".js") {
                scripts.push(src.to_string());
            }
        }
    }
    // The id lives in one of the last bundles.
    for src in scripts.iter().rev() {
        let Ok(resp) = client().get(src).send().await else { continue };
        let Ok(js) = resp.text().await else { continue };
        if let Some(id) = find_client_id(&js) {
            return Ok(id);
        }
    }
    Err("не нашёл client_id SoundCloud".into())
}

async fn client_id(app: &AppHandle, refresh: bool) -> Result<String, String> {
    let mut cached = CLIENT_ID.lock().await;
    if !refresh {
        if let Some(id) = cached.as_ref() {
            return Ok(id.clone());
        }
        if let Ok(id) = tokio::fs::read_to_string(id_file(app)).await {
            let id = id.trim().to_string();
            if id.len() == 32 {
                *cached = Some(id.clone());
                return Ok(id);
            }
        }
    }
    let id = scrape_client_id().await?;
    let _ = tokio::fs::create_dir_all(data_dir(app)).await;
    let _ = tokio::fs::write(id_file(app), &id).await;
    *cached = Some(id.clone());
    Ok(id)
}

/// GET against the API with the client id, re-scraping it once if SoundCloud
/// has rotated it (401/403).
async fn api_get<T: for<'de> Deserialize<'de>>(app: &AppHandle, url: &str) -> Result<T, String> {
    for attempt in 0..2 {
        let id = client_id(app, attempt == 1).await?;
        let resp = client()
            .get(url)
            .query(&[("client_id", id.as_str())])
            .send()
            .await
            .map_err(|e| format!("SoundCloud не ответил: {e}"))?;
        let status = resp.status().as_u16();
        if (status == 401 || status == 403) && attempt == 0 {
            continue;
        }
        if status == 404 {
            return Err("трек не найден на SoundCloud".into());
        }
        if status >= 400 {
            return Err(format!("SoundCloud ответил {status}"));
        }
        let body = resp.bytes().await.map_err(|e| format!("обрыв ответа SoundCloud: {e}"))?;
        return serde_json::from_slice::<T>(&body).map_err(|e| format!("странный ответ SoundCloud: {e}"));
    }
    Err("SoundCloud не принял client_id".into())
}

/* ---------- track → stream ---------- */

#[derive(Deserialize)]
struct TrackInfo {
    #[serde(default)]
    media: Option<Media>,
    #[serde(default)]
    track_authorization: Option<String>,
}

#[derive(Deserialize)]
struct Media {
    #[serde(default)]
    transcodings: Vec<Transcoding>,
}

#[derive(Deserialize, Clone)]
struct Transcoding {
    url: String,
    #[serde(default)]
    preset: String,
    #[serde(default)]
    snipped: bool,
    format: TranscodingFormat,
}

#[derive(Deserialize, Clone)]
struct TranscodingFormat {
    #[serde(default)]
    protocol: String,
    #[serde(default)]
    mime_type: String,
}

#[derive(Deserialize)]
struct StreamUrl {
    url: String,
}

#[derive(Clone, Copy, PartialEq, Debug)]
enum Kind {
    Progressive,
    Hls,
}

#[derive(Clone, Copy, PartialEq, Debug)]
enum Codec {
    Aac,
    Mp3,
}

pub struct Stream {
    pub url: String,
    pub hls: bool,
    pub ext: &'static str,
}

fn classify(t: &Transcoding) -> Option<(Kind, Codec)> {
    let protocol = t.format.protocol.as_str();
    if protocol.contains("encrypted") || protocol.starts_with("ctr-") || protocol.starts_with("cbc-") {
        return None;
    }
    let kind = if protocol == "progressive" && !t.url.contains("/hls") { Kind::Progressive } else if protocol == "hls" { Kind::Hls } else { return None };
    let mime = t.format.mime_type.to_ascii_lowercase();
    let codec = if mime.contains("mp4a") || mime.contains("audio/mp4") || t.preset.starts_with("aac") {
        Codec::Aac
    } else if mime.contains("mpeg") || t.preset.starts_with("mp3") {
        Codec::Mp3
    } else {
        // Opus and anything new: let yt-dlp handle it.
        return None;
    };
    if t.preset.starts_with("abr") {
        return None;
    }
    Some((kind, codec))
}

/// Progressive first (plays at once, seeks), AAC before MP3, full before preview.
fn rank(t: &Transcoding) -> Option<u32> {
    let (kind, codec) = classify(t)?;
    let mut score = 0;
    if kind == Kind::Progressive {
        score += 4;
    }
    if codec == Codec::Aac {
        score += 2;
    }
    if !t.snipped {
        score += 8;
    }
    Some(score)
}

fn pick(transcodings: &[Transcoding]) -> Option<&Transcoding> {
    transcodings.iter().filter_map(|t| rank(t).map(|r| (r, t))).max_by_key(|(r, _)| *r).map(|(_, t)| t)
}

pub async fn resolve(app: &AppHandle, page_url: &str) -> Result<Stream, String> {
    let resolve_url = format!("{API}/resolve?url={}", urlencode(page_url));
    let info: TrackInfo = api_get(app, &resolve_url).await?;
    let transcodings = info.media.map(|m| m.transcodings).unwrap_or_default();
    let t = pick(&transcodings).ok_or("у трека нет подходящего потока")?.clone();
    let (kind, codec) = classify(&t).expect("picked transcodings classify");
    let mut url = t.url.clone();
    if let Some(auth) = info.track_authorization.as_deref() {
        url.push_str(if url.contains('?') { "&" } else { "?" });
        url.push_str("track_authorization=");
        url.push_str(&urlencode(auth));
    }
    let stream: StreamUrl = api_get(app, &url).await?;
    Ok(Stream {
        url: stream.url,
        hls: kind == Kind::Hls,
        ext: match codec {
            Codec::Aac => "m4a",
            Codec::Mp3 => "mp3",
        },
    })
}

fn urlencode(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => out.push(b as char),
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

/* ---------- HLS → one file ---------- */

struct Playlist {
    init: Option<String>,
    segments: Vec<String>,
}

fn join_url(base: &str, uri: &str) -> String {
    if uri.starts_with("http://") || uri.starts_with("https://") {
        return uri.to_string();
    }
    let base = base.split(['?', '#']).next().unwrap_or(base);
    if let Some(path) = uri.strip_prefix('/') {
        let origin: String = base.splitn(4, '/').take(3).collect::<Vec<_>>().join("/");
        return format!("{origin}/{path}");
    }
    match base.rfind('/') {
        Some(i) => format!("{}/{uri}", &base[..i]),
        None => uri.to_string(),
    }
}

fn parse_playlist(base: &str, text: &str) -> Result<Playlist, String> {
    if !text.trim_start().starts_with("#EXTM3U") {
        return Err("это не плейлист HLS".into());
    }
    let mut init = None;
    let mut segments = vec![];
    for line in text.lines().map(str::trim) {
        if line.starts_with("#EXT-X-KEY") && !line.contains("METHOD=NONE") {
            return Err("поток зашифрован".into());
        }
        if line.starts_with("#EXT-X-BYTERANGE") || line.starts_with("#EXT-X-STREAM-INF") {
            return Err("такой HLS не склеить".into());
        }
        if let Some(attrs) = line.strip_prefix("#EXT-X-MAP:") {
            if attrs.contains("BYTERANGE") {
                return Err("такой HLS не склеить".into());
            }
            let uri = attrs.split("URI=\"").nth(1).and_then(|s| s.split('"').next()).ok_or("битый EXT-X-MAP")?;
            init = Some(join_url(base, uri));
        } else if !line.is_empty() && !line.starts_with('#') {
            segments.push(join_url(base, line));
        }
    }
    if segments.is_empty() {
        return Err("пустой плейлист".into());
    }
    Ok(Playlist { init, segments })
}

/// Fetches every piece, `SEGMENT_PARALLEL` at a time, and writes them in order.
/// `on_progress` gets the fraction of pieces done.
pub async fn fetch_hls(url: &str, codec_ext: &str, dest: &Path, on_progress: impl Fn(f64)) -> Result<(), String> {
    let text = client()
        .get(url)
        .send()
        .await
        .and_then(|r| r.error_for_status())
        .map_err(|e| format!("плейлист не скачался: {e}"))?
        .text()
        .await
        .map_err(|e| e.to_string())?;
    let playlist = parse_playlist(url, &text)?;
    if codec_ext == "m4a" && playlist.init.is_none() {
        // AAC in MPEG-TS pieces doesn't play as one file; yt-dlp + ffmpeg handle it.
        return Err("HLS без init-сегмента".into());
    }
    let mut urls = vec![];
    urls.extend(playlist.init.clone());
    urls.extend(playlist.segments.iter().cloned());
    let total = urls.len() as f64;

    let tmp = dest.with_extension("part");
    let mut file = tokio::fs::File::create(&tmp).await.map_err(|e| e.to_string())?;
    let mut done = 0f64;
    let mut pieces = stream::iter(urls.into_iter().map(|u| async move {
        client()
            .get(&u)
            .send()
            .await
            .and_then(|r| r.error_for_status())
            .map_err(|e| format!("кусок потока не скачался: {e}"))?
            .bytes()
            .await
            .map_err(|e| format!("обрыв: {e}"))
    }))
    .buffered(SEGMENT_PARALLEL);
    let result = async {
        while let Some(bytes) = pieces.try_next().await? {
            file.write_all(&bytes).await.map_err(|e| e.to_string())?;
            done += 1.0;
            on_progress(done / total);
        }
        file.flush().await.map_err(|e| e.to_string())
    }
    .await;
    drop(file);
    if let Err(e) = result {
        let _ = tokio::fs::remove_file(&tmp).await;
        return Err(e);
    }
    tokio::fs::rename(&tmp, dest).await.map_err(|e| e.to_string())
}

/// Downloads a progressive stream to `dest`, reporting the fraction done.
pub async fn fetch_progressive(url: &str, dest: &Path, on_progress: impl Fn(f64)) -> Result<(), String> {
    let resp = client()
        .get(url)
        .send()
        .await
        .and_then(|r| r.error_for_status())
        .map_err(|e| format!("поток не скачался: {e}"))?;
    let total = resp.content_length().unwrap_or(0) as f64;
    let tmp = dest.with_extension("part");
    let mut file = tokio::fs::File::create(&tmp).await.map_err(|e| e.to_string())?;
    let mut done = 0f64;
    let mut body = resp.bytes_stream();
    let result = async {
        while let Some(chunk) = body.next().await {
            let chunk = chunk.map_err(|e| format!("обрыв: {e}"))?;
            file.write_all(&chunk).await.map_err(|e| e.to_string())?;
            done += chunk.len() as f64;
            if total > 0.0 {
                on_progress(done / total);
            }
        }
        file.flush().await.map_err(|e| e.to_string())
    }
    .await;
    drop(file);
    if let Err(e) = result {
        let _ = tokio::fs::remove_file(&tmp).await;
        return Err(e);
    }
    tokio::fs::rename(&tmp, dest).await.map_err(|e| e.to_string())
}

/// Headers the proxy sends when it forwards a progressive stream.
pub fn proxy_headers() -> Vec<(String, String)> {
    vec![("User-Agent".into(), UA.into())]
}

#[cfg(test)]
mod tests {
    use super::*;

    fn t(protocol: &str, mime: &str, preset: &str, snipped: bool) -> Transcoding {
        Transcoding {
            url: format!("https://api-v2.soundcloud.com/media/x/{preset}/{protocol}"),
            preset: preset.into(),
            snipped,
            format: TranscodingFormat { protocol: protocol.into(), mime_type: mime.into() },
        }
    }

    #[test]
    fn finds_the_client_id_in_a_bundle() {
        let js = r#"x={a:1,client_id:"short"},y={client_id:"aB3dE5gH7jK9mN1pQ3sT5vX7zA9cE1gH",env:"prod"}"#;
        assert_eq!(find_client_id(js).as_deref(), Some("aB3dE5gH7jK9mN1pQ3sT5vX7zA9cE1gH"));
        assert_eq!(find_client_id("client_id:\"tooShort\""), None);
    }

    #[test]
    fn prefers_progressive_then_aac_and_skips_what_we_cant_join() {
        let list = vec![
            t("hls", "audio/mpeg", "mp3_1_0", false),
            t("hls", "audio/ogg; codecs=\"opus\"", "opus_0_0", false),
            t("hls", "audio/mp4; codecs=\"mp4a.40.2\"", "aac_160k", false),
            t("encrypted-hls", "audio/mp4; codecs=\"mp4a.40.2\"", "aac_160k", false),
        ];
        assert_eq!(pick(&list).unwrap().preset, "aac_160k");
        assert_eq!(classify(pick(&list).unwrap()), Some((Kind::Hls, Codec::Aac)));

        let mut with_progressive = list.clone();
        with_progressive.push(t("progressive", "audio/mpeg", "mp3_0_0", false));
        assert_eq!(classify(pick(&with_progressive).unwrap()), Some((Kind::Progressive, Codec::Mp3)));

        let previews = vec![t("progressive", "audio/mpeg", "mp3_0_0", true), t("hls", "audio/mpeg", "mp3_1_0", false)];
        assert!(!pick(&previews).unwrap().snipped);
        assert!(pick(&[t("hls", "audio/ogg; codecs=\"opus\"", "opus_0_0", false)]).is_none());
    }

    #[test]
    fn parses_playlists() {
        let base = "https://cf-hls-media.sndcdn.com/playlist/abc/aac.m3u8?Policy=x";
        let fmp4 = "#EXTM3U\n#EXT-X-VERSION:7\n#EXT-X-MAP:URI=\"init.mp4?a=1\"\n#EXTINF:10,\nseg0.m4s?a=1\n#EXTINF:10,\nhttps://other.example/seg1.m4s\n#EXT-X-ENDLIST\n";
        let p = parse_playlist(base, fmp4).unwrap();
        assert_eq!(p.init.as_deref(), Some("https://cf-hls-media.sndcdn.com/playlist/abc/init.mp4?a=1"));
        assert_eq!(p.segments, vec!["https://cf-hls-media.sndcdn.com/playlist/abc/seg0.m4s?a=1", "https://other.example/seg1.m4s"]);
        let abs = parse_playlist(base, "#EXTM3U\n#EXTINF:10,\n/media/0/1.mp3\n").unwrap();
        assert_eq!(abs.segments, vec!["https://cf-hls-media.sndcdn.com/media/0/1.mp3"]);
        assert!(parse_playlist(base, "#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI=\"k\"\nseg.ts\n").is_err());
        assert!(parse_playlist(base, "<html>").is_err());
    }

    #[test]
    fn encodes_query_values() {
        assert_eq!(urlencode("https://soundcloud.com/a b/c?d=1"), "https%3A%2F%2Fsoundcloud.com%2Fa%20b%2Fc%3Fd%3D1");
    }
}
