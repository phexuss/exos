#!/usr/bin/env bash
# Markdown release notes for the desktop app from the commits that touched
# desktop/ since the previous desktop tag. Usage: desktop-release-notes.sh <new-tag> <dir-with-installers>
set -euo pipefail

tag="$1"
dir="$2"
repo="${GITHUB_REPOSITORY:-phexuss/exos}"

prev=$(git describe --tags --abbrev=0 --match 'desktop-v*' HEAD 2>/dev/null || true)
if [[ "$prev" == "$tag" ]]; then
  prev=$(git describe --tags --abbrev=0 --match 'desktop-v*' HEAD^ 2>/dev/null || true)
fi
range="${prev:+$prev..}HEAD"

echo "## EXØS desktop ${tag#desktop-v}"
echo
echo "### Изменения"
echo
changes=$(git log --no-merges --format='- %s (%h)' "$range" -- desktop .github/workflows/desktop.yml | head -60)
echo "${changes:-- Без изменений в desktop/}"
echo
echo "### 📦 Установка"
echo
echo "| Система | Файл |"
echo "| --- | --- |"
for f in "$dir"/*; do
  name=$(basename "$f")
  case "$name" in
    *.exe) os="Windows" ;;
    *.dmg) os="macOS (Intel и Apple Silicon)" ;;
    *.AppImage) os="Linux, AppImage" ;;
    *.tar.gz) os="Linux, архив (распаковать и запустить ./exos)" ;;
    *) continue ;;
  esac
  echo "| $os | \`$name\` · $(du -h "$f" | cut -f1) |"
done
echo
echo "Сборки не подписаны: Windows покажет SmartScreen (Подробнее → Выполнить в любом случае), macOS попросит открыть через правый клик → Открыть."
echo
echo "SHA-256:"
echo
echo '```'
(cd "$dir" && sha256sum -- *)
echo '```'

if [[ -n "$prev" ]]; then
  echo
  echo "**Все изменения**: https://github.com/${repo}/compare/${prev}...${tag}"
fi
