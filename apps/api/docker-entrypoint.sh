#!/bin/sh
set -e

# yt-dlp rewrites its --cookies file on exit. A cookies.txt bind-mounted from
# the host is usually not writable by the container's user, so work on a
# private copy instead.
if [ -n "$YTDLP_COOKIES_PATH" ] && [ -f "$YTDLP_COOKIES_PATH" ] && [ ! -w "$YTDLP_COOKIES_PATH" ]; then
  cp "$YTDLP_COOKIES_PATH" /tmp/yt-dlp-cookies.txt
  export YTDLP_COOKIES_PATH=/tmp/yt-dlp-cookies.txt
fi

exec "$@"
