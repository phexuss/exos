#!/bin/sh
set -e

# yt-dlp rewrites its --cookies file on exit. A cookies.txt bind-mounted from
# the host is usually not writable by the container's user, so work on a
# private copy instead.
if [ -n "$YTDLP_COOKIES_PATH" ] && [ -f "$YTDLP_COOKIES_PATH" ] && [ ! -w "$YTDLP_COOKIES_PATH" ]; then
  cp "$YTDLP_COOKIES_PATH" /tmp/yt-dlp-cookies.txt
  export YTDLP_COOKIES_PATH=/tmp/yt-dlp-cookies.txt
fi

# YouTube changes often and yt-dlp ships fixes within days, so a build that
# is a week old can already fail. Refresh it on every start.
ytdlp="${YTDLP_PATH:-/usr/bin/yt-dlp}"
if [ "${YTDLP_AUTOUPDATE:-1}" = "1" ] && [ -w "$(dirname "$(readlink -f "$ytdlp")")" ]; then
  timeout 60 "$ytdlp" --ignore-config -U \
    || echo "yt-dlp update failed, using $("$ytdlp" --version)"
fi

exec "$@"
