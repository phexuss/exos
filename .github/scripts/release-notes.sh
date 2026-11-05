#!/usr/bin/env bash
# Markdown release notes for the Android app from the commits that touched
# apps/mobile since the previous Android tag, in the same layout as the
# desktop notes. Usage: release-notes.sh <new-tag> [apk-path]
set -euo pipefail

tag="$1"
apk="${2:-}"
repo="${GITHUB_REPOSITORY:-phexuss/exos}"

# Android tags only: android-v1.2.3, or v1.2.3 for releases up to 0.4.1. The
# desktop app has its own desktop-v* tags.
match=(--match 'android-v[0-9]*' --match 'v[0-9]*')
prev=$(git describe --tags --abbrev=0 "${match[@]}" HEAD 2>/dev/null || true)
if [[ "$prev" == "$tag" ]]; then
  prev=$(git describe --tags --abbrev=0 "${match[@]}" HEAD^ 2>/dev/null || true)
fi
range="${prev:+$prev..}HEAD"

version="${tag#android-}"
echo "## EXØS Android ${version#v}"
echo
echo "### What's changed"
echo
changes=$(git log --no-merges --format='- %s (%h)' "$range" -- apps/mobile patches | head -60)
echo "${changes:-- No changes in apps/mobile}"
echo

if [[ -n "$apk" ]]; then
  name=$(basename "$apk")
  echo "### 📦 Install"
  echo
  echo "| System | File |"
  echo "| --- | --- |"
  echo "| Android 7+ (arm64, armv7) | \`$name\` · $(du -h "$apk" | cut -f1) |"
  echo
  echo "Installs over earlier releases. Test builds from pull requests are signed with a throwaway key: uninstall them first."
  echo
  echo "SHA-256:"
  echo
  echo '```'
  echo "$(sha256sum "$apk" | cut -d' ' -f1)  $name"
  echo '```'
fi

if [[ -n "$prev" ]]; then
  echo
  echo "**Full changelog**: https://github.com/${repo}/compare/${prev}...${tag}"
fi
