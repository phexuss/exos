//! A small HTTP server on 127.0.0.1 that feeds the player.
//!
//! WebKitGTK refuses audio from Tauri's custom protocols ("The operation is
//! not supported"), and CDN links from yt-dlp often only answer requests
//! carrying the headers yt-dlp used. Plain loopback HTTP plays in every
//! webview, so local files and CDN streams both go through here. Each URL
//! carries a random per-launch secret and a token we handed out ourselves, so
//! nothing else on the machine can read files through it.

use std::collections::hash_map::RandomState;
use std::collections::HashMap;
use std::hash::{BuildHasher, Hasher};
use std::io::SeekFrom;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};
use std::time::Duration;

use futures_util::StreamExt;
use tokio::io::{AsyncReadExt, AsyncSeekExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};

const AUDIO_EXTS: &[&str] = &["m4a", "mp3", "mp4", "aac", "opus", "ogg", "oga", "webm", "flac", "wav"];

#[derive(Clone)]
enum Source {
    File(PathBuf),
    Remote { url: String, headers: Vec<(String, String)>, ext: String },
}

struct Server {
    base: String,
    tokens: Mutex<HashMap<String, Source>>,
}

static SERVER: OnceLock<Server> = OnceLock::new();

fn random_hex() -> String {
    let mut out = String::new();
    for _ in 0..2 {
        let mut h = RandomState::new().build_hasher();
        h.write_u128(std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_nanos());
        out.push_str(&format!("{:016x}", h.finish()));
    }
    out
}

fn client() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .connect_timeout(Duration::from_secs(15))
            .build()
            .expect("http client")
    })
}

/// Binds the server; called once from setup.
pub async fn start() -> Result<(), String> {
    let listener = TcpListener::bind("127.0.0.1:0").await.map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let server = Server { base: format!("http://127.0.0.1:{port}/{}", random_hex()), tokens: Mutex::new(HashMap::new()) };
    if SERVER.set(server).is_err() {
        return Ok(());
    }
    tauri::async_runtime::spawn(async move {
        loop {
            let Ok((sock, _)) = listener.accept().await else { continue };
            tauri::async_runtime::spawn(async move {
                let _ = serve(sock).await;
            });
        }
    });
    Ok(())
}

fn register(source: Source) -> Result<String, String> {
    let server = SERVER.get().ok_or("плеер ещё не готов")?;
    let token = random_hex();
    let mut tokens = server.tokens.lock().unwrap();
    // Keep the map from growing forever over a long session.
    if tokens.len() > 500 {
        tokens.clear();
    }
    tokens.insert(token.clone(), source);
    Ok(format!("{}/{token}", server.base))
}

fn is_audio(path: &Path) -> bool {
    path.extension()
        .map(|e| AUDIO_EXTS.contains(&e.to_string_lossy().to_ascii_lowercase().as_str()))
        .unwrap_or(false)
}

/// A URL the player can load for a file on disk.
pub fn file_url(path: &str) -> Result<String, String> {
    let p = PathBuf::from(path);
    if !is_audio(&p) {
        return Err("это не аудиофайл".into());
    }
    if !p.is_file() {
        return Err("файл не найден".into());
    }
    register(Source::File(p))
}

/// A URL the player can load for a CDN link, sent with yt-dlp's headers.
pub fn remote_url(url: String, headers: Vec<(String, String)>, ext: String) -> Result<String, String> {
    register(Source::Remote { url, headers, ext })
}

fn mime(ext: &str) -> &'static str {
    match ext {
        "m4a" | "mp4" => "audio/mp4",
        "mp3" => "audio/mpeg",
        "aac" => "audio/aac",
        "opus" | "ogg" | "oga" => "audio/ogg",
        "webm" => "audio/webm",
        "flac" => "audio/flac",
        "wav" => "audio/wav",
        _ => "application/octet-stream",
    }
}

struct Request {
    head: bool,
    token: String,
    range: Option<(Option<u64>, Option<u64>)>,
}

async fn read_request(sock: &mut TcpStream) -> Option<Request> {
    let mut buf = Vec::with_capacity(1024);
    let mut chunk = [0u8; 1024];
    while !buf.windows(4).any(|w| w == b"\r\n\r\n") {
        if buf.len() > 16 * 1024 {
            return None;
        }
        let n = tokio::time::timeout(Duration::from_secs(10), sock.read(&mut chunk)).await.ok()?.ok()?;
        if n == 0 {
            return None;
        }
        buf.extend_from_slice(&chunk[..n]);
    }
    let text = String::from_utf8_lossy(&buf);
    let mut lines = text.split("\r\n");
    let mut first = lines.next()?.split(' ');
    let method = first.next()?;
    let target = first.next()?;
    let server = SERVER.get()?;
    let prefix = server.base.splitn(4, '/').nth(3).map(|s| format!("/{s}/"))?;
    let token = target.strip_prefix(&prefix)?.split(['?', '#']).next()?.to_string();
    let mut range = None;
    for line in lines {
        let Some((name, value)) = line.split_once(':') else { continue };
        if name.trim().eq_ignore_ascii_case("range") {
            if let Some(spec) = value.trim().strip_prefix("bytes=") {
                let (a, b) = spec.split(',').next()?.split_once('-')?;
                range = Some((a.trim().parse().ok(), b.trim().parse().ok()));
            }
        }
    }
    Some(Request { head: method == "HEAD", token, range })
}

async fn write_head(sock: &mut TcpStream, status: &str, headers: &[(&str, String)]) -> std::io::Result<()> {
    let mut out = format!("HTTP/1.1 {status}\r\nConnection: close\r\nAccess-Control-Allow-Origin: *\r\n");
    for (k, v) in headers {
        out.push_str(&format!("{k}: {v}\r\n"));
    }
    out.push_str("\r\n");
    sock.write_all(out.as_bytes()).await
}

async fn serve(mut sock: TcpStream) -> std::io::Result<()> {
    let Some(req) = read_request(&mut sock).await else {
        return write_head(&mut sock, "400 Bad Request", &[("Content-Length", "0".into())]).await;
    };
    let source = SERVER.get().and_then(|s| s.tokens.lock().unwrap().get(&req.token).cloned());
    match source {
        Some(Source::File(path)) => serve_file(&mut sock, &req, &path).await,
        Some(Source::Remote { url, headers, ext }) => serve_remote(&mut sock, &req, &url, &headers, &ext).await,
        None => write_head(&mut sock, "404 Not Found", &[("Content-Length", "0".into())]).await,
    }
}

async fn serve_file(sock: &mut TcpStream, req: &Request, path: &Path) -> std::io::Result<()> {
    let mut file = match tokio::fs::File::open(path).await {
        Ok(f) => f,
        Err(_) => return write_head(sock, "404 Not Found", &[("Content-Length", "0".into())]).await,
    };
    let len = file.metadata().await?.len();
    let ext = path.extension().map(|e| e.to_string_lossy().to_ascii_lowercase()).unwrap_or_default();
    let mut headers = vec![("Content-Type", mime(&ext).to_string()), ("Accept-Ranges", "bytes".to_string())];

    let (status, start, end) = match req.range {
        None => ("200 OK", 0, len.saturating_sub(1)),
        Some((Some(a), b)) => ("206 Partial Content", a, b.unwrap_or(len.saturating_sub(1)).min(len.saturating_sub(1))),
        Some((None, Some(suffix))) => ("206 Partial Content", len.saturating_sub(suffix), len.saturating_sub(1)),
        Some((None, None)) => ("200 OK", 0, len.saturating_sub(1)),
    };
    if len == 0 || start > end || start >= len {
        headers.push(("Content-Range", format!("bytes */{len}")));
        headers.push(("Content-Length", "0".into()));
        return write_head(sock, "416 Range Not Satisfiable", &headers).await;
    }
    let count = end - start + 1;
    if status.starts_with("206") {
        headers.push(("Content-Range", format!("bytes {start}-{end}/{len}")));
    }
    headers.push(("Content-Length", count.to_string()));
    write_head(sock, status, &headers).await?;
    if req.head {
        return Ok(());
    }
    file.seek(SeekFrom::Start(start)).await?;
    let mut limited = file.take(count);
    tokio::io::copy(&mut limited, sock).await?;
    Ok(())
}

/// Upstream requests ask for at most this much at a time. YouTube's CDN throttles
/// or refuses open-ended ranges (yt-dlp fetches it in 10 MiB pieces for the
/// same reason), while the webview always asks for "the rest of the file".
const CHUNK: u64 = if cfg!(test) { 1000 } else { 10 << 20 };

async fn upstream(
    url: &str,
    headers: &[(String, String)],
    method: reqwest::Method,
    range: Option<String>,
) -> Option<reqwest::Response> {
    let mut r = client().request(method, url);
    for (k, v) in headers {
        r = r.header(k.as_str(), v.as_str());
    }
    if let Some(range) = range {
        r = r.header("Range", range);
    }
    match r.send().await {
        Ok(resp) => Some(resp),
        Err(e) => {
            eprintln!("media: upstream request failed: {e}");
            None
        }
    }
}

/// "bytes 0-999/5000" → (0, 999, 5000).
fn content_range(resp: &reqwest::Response) -> Option<(u64, u64, u64)> {
    let v = resp.headers().get("content-range")?.to_str().ok()?;
    let (span, total) = v.strip_prefix("bytes ")?.split_once('/')?;
    let (a, b) = span.split_once('-')?;
    Some((a.parse().ok()?, b.parse().ok()?, total.parse().ok()?))
}

async fn pipe(sock: &mut TcpStream, resp: reqwest::Response) -> std::io::Result<u64> {
    let mut sent = 0;
    let mut body = resp.bytes_stream();
    while let Some(chunk) = body.next().await {
        let Ok(chunk) = chunk else { break };
        sock.write_all(&chunk).await?;
        sent += chunk.len() as u64;
    }
    Ok(sent)
}

fn refuse(code: u16) -> &'static str {
    if code == 416 {
        "416 Range Not Satisfiable"
    } else {
        "502 Bad Gateway"
    }
}

async fn serve_remote(
    sock: &mut TcpStream,
    req: &Request,
    url: &str,
    headers: &[(String, String)],
    ext: &str,
) -> std::io::Result<()> {
    // CDNs label audio-only MP4 as video/mp4; say what it is so the decoder doesn't hesitate.
    let mut out = vec![("Content-Type", mime(ext).to_string()), ("Accept-Ranges", "bytes".to_string())];
    let (from, to) = match req.range {
        Some((Some(a), b)) => (a, b),
        None | Some((None, None)) => (0, None),
        // A suffix range needs the length first; rare enough to pass through.
        Some((None, Some(suffix))) => return passthrough(sock, req, url, headers, out, format!("bytes=-{suffix}")).await,
    };
    let first_end = to.unwrap_or(u64::MAX).min(from.saturating_add(CHUNK - 1));
    let method = if req.head { reqwest::Method::HEAD } else { reqwest::Method::GET };
    let Some(resp) = upstream(url, headers, method, Some(format!("bytes={from}-{first_end}"))).await else {
        return write_head(sock, "502 Bad Gateway", &[("Content-Length", "0".into())]).await;
    };
    let code = resp.status().as_u16();
    if code >= 400 {
        eprintln!("media: upstream answered {code}");
        return write_head(sock, refuse(code), &[("Content-Length", "0".into())]).await;
    }
    let Some((_, got_end, total)) = content_range(&resp).filter(|_| code == 206) else {
        // The server ignored Range and sends the whole file: hand it over as is.
        if let Some(v) = resp.headers().get("content-length").and_then(|v| v.to_str().ok()) {
            out.push(("Content-Length", v.to_string()));
        }
        write_head(sock, "200 OK", &out).await?;
        if !req.head {
            pipe(sock, resp).await?;
        }
        return Ok(());
    };
    let end = to.unwrap_or(total.saturating_sub(1)).min(total.saturating_sub(1));
    out.push(("Content-Length", (end + 1 - from).to_string()));
    let status = if req.range.is_some() {
        out.push(("Content-Range", format!("bytes {from}-{end}/{total}")));
        "206 Partial Content"
    } else {
        "200 OK"
    };
    write_head(sock, status, &out).await?;
    if req.head {
        return Ok(());
    }
    let mut pos = from + pipe(sock, resp).await?;
    if pos != got_end + 1 {
        return Ok(()); // cut short; the webview will ask again from where it stopped
    }
    while pos <= end {
        let stop = end.min(pos + CHUNK - 1);
        let Some(resp) = upstream(url, headers, reqwest::Method::GET, Some(format!("bytes={pos}-{stop}"))).await else {
            break;
        };
        if resp.status().as_u16() != 206 {
            eprintln!("media: upstream answered {} mid-stream", resp.status().as_u16());
            break;
        }
        let sent = pipe(sock, resp).await?;
        if sent == 0 {
            break;
        }
        pos += sent;
    }
    Ok(())
}

async fn passthrough(
    sock: &mut TcpStream,
    req: &Request,
    url: &str,
    headers: &[(String, String)],
    mut out: Vec<(&str, String)>,
    range: String,
) -> std::io::Result<()> {
    let method = if req.head { reqwest::Method::HEAD } else { reqwest::Method::GET };
    let Some(resp) = upstream(url, headers, method, Some(range)).await else {
        return write_head(sock, "502 Bad Gateway", &[("Content-Length", "0".into())]).await;
    };
    let code = resp.status().as_u16();
    if code >= 400 {
        return write_head(sock, refuse(code), &[("Content-Length", "0".into())]).await;
    }
    for name in ["content-length", "content-range"] {
        if let Some(v) = resp.headers().get(name).and_then(|v| v.to_str().ok()) {
            out.push((if name == "content-length" { "Content-Length" } else { "Content-Range" }, v.to_string()));
        }
    }
    write_head(sock, if code == 206 { "206 Partial Content" } else { "200 OK" }, &out).await?;
    if !req.head {
        pipe(sock, resp).await?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn get(url: &str, range: Option<&str>) -> (u16, Option<String>, Vec<u8>) {
        let mut r = reqwest::Client::new().get(url);
        if let Some(range) = range {
            r = r.header("Range", range);
        }
        let resp = r.send().await.unwrap();
        let status = resp.status().as_u16();
        let cr = resp.headers().get("content-range").map(|v| v.to_str().unwrap().to_string());
        (status, cr, resp.bytes().await.unwrap().to_vec())
    }

    #[tokio::test(flavor = "multi_thread")]
    async fn serves_files_and_proxies_ranges() {
        start().await.unwrap();
        let dir = std::env::temp_dir().join(format!("exos-media-{}", random_hex()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("t.m4a");
        let data: Vec<u8> = (0..5000u32).map(|i| (i % 251) as u8).collect();
        std::fs::write(&path, &data).unwrap();

        let url = file_url(path.to_str().unwrap()).unwrap();
        assert_eq!(get(&url, None).await, (200, None, data.clone()));
        let (s, cr, body) = get(&url, Some("bytes=100-199")).await;
        assert_eq!((s, cr.as_deref(), body.as_slice()), (206, Some("bytes 100-199/5000"), &data[100..200]));
        let (s, _, body) = get(&url, Some("bytes=4990-")).await;
        assert_eq!((s, body.as_slice()), (206, &data[4990..]));
        assert_eq!(get(&url, Some("bytes=6000-")).await.0, 416);

        // Unknown token and a wrong secret are refused.
        assert_eq!(get(&format!("{url}x"), None).await.0, 404);
        let wrong = url.rsplitn(3, '/').nth(2).unwrap().to_string() + "/nope/abc";
        assert_eq!(get(&wrong, None).await.0, 400);
        assert!(file_url("/etc/passwd").is_err());

        // The proxy forwards Range and passes the partial answer through.
        let proxied = remote_url(url.clone(), vec![("User-Agent".into(), "exos-test".into())], "m4a".into()).unwrap();
        let (s, cr, body) = get(&proxied, Some("bytes=10-19")).await;
        assert_eq!((s, cr.as_deref(), body.as_slice()), (206, Some("bytes 10-19/5000"), &data[10..20]));
        // Larger asks are fetched upstream in CHUNK-sized pieces and stitched back.
        let (s, cr, body) = get(&proxied, Some("bytes=900-2100")).await;
        assert_eq!((s, cr.as_deref(), body.as_slice()), (206, Some("bytes 900-2100/5000"), &data[900..2101]));
        let (s, cr, body) = get(&proxied, Some("bytes=1500-")).await;
        assert_eq!((s, cr.as_deref(), body.as_slice()), (206, Some("bytes 1500-4999/5000"), &data[1500..]));
        assert_eq!(get(&proxied, None).await, (200, None, data.clone()));
        let (s, cr, body) = get(&proxied, Some("bytes=-100")).await;
        assert_eq!((s, cr.as_deref(), body.as_slice()), (206, Some("bytes 4900-4999/5000"), &data[4900..]));
        std::fs::remove_dir_all(dir).unwrap();
    }
}
