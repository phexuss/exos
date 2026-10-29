#!/usr/bin/env bash
# Builds Markdown release notes for the mobile app from the commits since the
# previous tag. Usage: release-notes.sh <new-tag> [apk-path]
set -euo pipefail

tag="$1"
apk="${2:-}"
repo="${GITHUB_REPOSITORY:-phexuss/exos}"

# Mobile tags only (v1.2.3); the desktop app has its own desktop-v* tags.
prev=$(git describe --tags --abbrev=0 --match 'v[0-9]*' HEAD 2>/dev/null || true)
if [[ "$prev" == "$tag" ]]; then
  prev=$(git describe --tags --abbrev=0 --match 'v[0-9]*' HEAD^ 2>/dev/null || true)
fi
range="${prev:+$prev..}HEAD"

declare -A sections=(
  [feat]="✨ Новое"
  [fix]="🐛 Исправления"
  [perf]="⚡ Производительность"
  [other]="🔧 Прочее"
)
declare -A lines=()

while IFS=$'\t' read -r hash subject; do
  [[ -z "$hash" ]] && continue
  type="other"
  text="$subject"
  if [[ "$subject" =~ ^(feat|fix|perf)(\([^\)]*\))?!?:[[:space:]]*(.*)$ ]]; then
    type="${BASH_REMATCH[1]}"
    text="${BASH_REMATCH[3]}"
  fi
  lines[$type]+="- ${text} (${hash})"$'\n'
done < <(git log --no-merges --format=$'%h\t%s' "$range" -- apps/mobile patches)

echo "## EXØS ${tag}"
echo
if [[ ${#lines[@]} -eq 0 ]]; then
  echo "Изменений в мобильном приложении нет."
  echo
fi
for type in feat fix perf other; do
  if [[ -n "${lines[$type]:-}" ]]; then
    echo "### ${sections[$type]}"
    echo
    printf '%s\n' "${lines[$type]}"
  fi
done

if [[ -n "$apk" ]]; then
  echo "### 📦 APK"
  echo
  echo "\`$(basename "$apk")\` · $(du -h "$apk" | cut -f1)"
  echo
  echo "SHA-256: \`$(sha256sum "$apk" | cut -d' ' -f1)\`"
  echo
fi

if [[ -n "$prev" ]]; then
  echo "**Все изменения**: https://github.com/${repo}/compare/${prev}...${tag}"
fi
