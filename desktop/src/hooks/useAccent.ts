import { useEffect } from 'react';
import type { Track } from '@/lib/types';
import { useSettings } from '@/store/settings';
import { imageUrl } from '@/lib/bridge';

/** Sentinel: drop the inline override so the --accent token from app.css applies. */
const FALLBACK = '';
const cache = new Map<string, string>();

function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h /= 6;
  return [h, s, l];
}

/** Legible accent from a color: keep the hue, lift it into a readable band on dark glass. */
function readable(h: number, s: number): string {
  if (s < 0.12) return FALLBACK;
  return hslToHex(h, Math.max(0.55, Math.min(s, 0.85)), 0.7);
}

function hueFromSeed(seed: string): string {
  let x = 0;
  for (let i = 0; i < seed.length; i += 1) x = (x * 31 + seed.charCodeAt(i)) | 0;
  return readable((Math.abs(x) % 360) / 360, 0.6);
}

function extract(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(FALLBACK);
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        // Saturation-weighted average hue, so a vivid detail beats a grey field.
        let x = 0;
        let y = 0;
        let wsum = 0;
        let ssum = 0;
        for (let i = 0; i < data.length; i += 4) {
          const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          const w = s * (1 - Math.abs(l - 0.5) * 1.6);
          if (w <= 0) continue;
          x += Math.cos(h * 2 * Math.PI) * w;
          y += Math.sin(h * 2 * Math.PI) * w;
          ssum += s * w;
          wsum += w;
        }
        if (wsum < 1) return resolve(FALLBACK);
        const hue = ((Math.atan2(y, x) / (2 * Math.PI)) + 1) % 1;
        resolve(readable(hue, ssum / wsum));
      } catch {
        resolve(FALLBACK);
      }
    };
    img.onerror = () => resolve(FALLBACK);
    img.src = imageUrl(url) ?? url;
  });
}

/** Sets --accent on the document from the current track's artwork. */
export function useAccent(track: Track | null) {
  const dynamic = useSettings((s) => s.dynamicAccent);
  useEffect(() => {
    const root = document.documentElement;
    if (!dynamic || !track) {
      root.style.removeProperty('--accent');
      return;
    }
    const key = track.coverUrl ?? `seed:${track.album ?? track.id}`;
    const apply = (c: string) => {
      if (c) root.style.setProperty('--accent', c);
      else root.style.removeProperty('--accent');
    };
    const hit = cache.get(key);
    if (hit) {
      apply(hit);
      return;
    }
    if (!track.coverUrl) {
      const c = hueFromSeed(track.album ?? track.id);
      cache.set(key, c);
      apply(c);
      return;
    }
    let alive = true;
    void extract(track.coverUrl).then((c) => {
      cache.set(key, c);
      if (alive) apply(c);
    });
    return () => {
      alive = false;
    };
  }, [track, dynamic]);
}
