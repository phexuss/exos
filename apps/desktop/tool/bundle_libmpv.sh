#!/usr/bin/env bash
# Copies the build machine's libmpv and the libraries it needs into
# <bundle>/lib/mpv, each with RUNPATH=$ORIGIN, so the Linux build plays audio
# on systems where the mpv package can't be installed. main.dart loads
# lib/mpv/libmpv.so.2 when it exists.
#
# Left out on purpose, taken from the user's system: glibc and the C++
# runtime, and everything tied to drivers or system daemons (GL, VA-API,
# VDPAU, Vulkan loader, DRM/GBM, ALSA, PulseAudio, PipeWire, udev, D-Bus,
# core X11/Wayland).
#
# Usage: tool/bundle_libmpv.sh build/linux/x64/release/bundle
set -euo pipefail

bundle=${1:?bundle directory}
src=$(ldconfig -p | awk '/libmpv\.so\.2 .*x86-64/ {print $NF; exit}')
[ -n "$src" ] || { echo "libmpv.so.2 not found; install libmpv-dev" >&2; exit 1; }

skip='^(linux-vdso|ld-linux|libc|libm|libpthread|libdl|librt|libresolv|libutil|libstdc\+\+|libgcc_s|libGL|libGLX|libGLdispatch|libOpenGL|libEGL|libdrm|libgbm|libvulkan|libva|libva-drm|libva-x11|libva-wayland|libvdpau|libasound|libpulse|libpulse-simple|libpulsecommon-[0-9.]+|libpipewire-[0-9.]+|libudev|libsystemd|libdbus-1|libX11|libxcb|libwayland-client|libwayland-cursor|libwayland-egl|libz)\.so'

out="$bundle/lib/mpv"
rm -rf "$out"
mkdir -p "$out"

ldd "$src" | awk '/=> \// {print $1, $3}' | while read -r name path; do
  if [[ "$name" =~ $skip ]]; then continue; fi
  cp -L "$path" "$out/$name"
done
cp -L "$src" "$out/libmpv.so.2"

for f in "$out"/*.so*; do
  chmod u+w "$f"
  patchelf --set-rpath '$ORIGIN' "$f"
done

echo "bundled $(ls "$out" | wc -l) libraries, $(du -sh "$out" | cut -f1)"
