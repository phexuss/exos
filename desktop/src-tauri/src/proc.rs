//! Spawning the bundled tools without flashing a console window on Windows.

use std::ffi::OsStr;
use std::path::Path;
use std::time::Duration;
use tokio::process::Command;

pub fn command(program: impl AsRef<OsStr>) -> Command {
    let mut cmd = Command::new(program);
    cmd.kill_on_drop(true);
    #[cfg(windows)]
    {
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd
}

/// Runs a tool and returns trimmed stdout, or stderr's last line as the error.
pub async fn output(program: &Path, args: &[&str], timeout: Duration) -> Result<String, String> {
    let fut = command(program).args(args).output();
    let out = tokio::time::timeout(timeout, fut)
        .await
        .map_err(|_| format!("{} не ответил за {} с", program.display(), timeout.as_secs()))?
        .map_err(|e| format!("не удалось запустить {}: {e}", program.display()))?;
    if out.status.success() {
        Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
    } else {
        Err(last_error_line(&String::from_utf8_lossy(&out.stderr)))
    }
}

/// The most useful line of a yt-dlp / ffmpeg error log.
pub fn last_error_line(stderr: &str) -> String {
    let lines: Vec<&str> = stderr.lines().map(str::trim).filter(|l| !l.is_empty()).collect();
    lines
        .iter()
        .rev()
        .find(|l| l.starts_with("ERROR"))
        .or_else(|| lines.last())
        .map(|l| l.trim_start_matches("ERROR:").trim().to_string())
        .unwrap_or_else(|| "неизвестная ошибка".into())
}
