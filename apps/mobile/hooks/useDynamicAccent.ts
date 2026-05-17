import { useEffect, useRef, useState } from 'react';

import { COLORS } from '@/constants/colors';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useSettingsStore } from '@/store/useSettingsStore';

const CACHE_CAPACITY = 200;
const cache = new Map<string, string>();

function cacheGet(url: string): string | undefined {
  const value = cache.get(url);
  if (value !== undefined) {
    cache.delete(url);
    cache.set(url, value);
  }
  return value;
}

function cacheSet(url: string, color: string): void {
  if (cache.has(url)) cache.delete(url);
  cache.set(url, color);
  if (cache.size > CACHE_CAPACITY) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l * 255;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3) * 255;
    g = hue2rgb(p, q, h) * 255;
    b = hue2rgb(p, q, h - 1 / 3) * 255;
  }

  const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function boostSaturation(hex: string): string {
  const [r, g, b] = parseHex(hex);
  let [h, s, l] = rgbToHsl(r, g, b);
  s = Math.min(1, s * 1.4 + 0.15);
  l = Math.max(0.35, Math.min(0.65, l));
  return hslToHex(h, s, l);
}

async function extractColor(url: string): Promise<string | null> {
  try {
    const tinyUrl = url.includes('dzcdn.net')
      ? url.replace(/\/\d+x\d+/, '/1x1')
      : url;

    const res = await fetch(tinyUrl);
    if (!res.ok) return null;

    const blob = await res.blob();
    const reader = new FileReader();

    return new Promise<string | null>((resolve) => {
      reader.onloadend = () => {
        const base64 = reader.result as string;

        const data = base64.split(',')[1];
        if (!data) {
          resolve(null);
          return;
        }

        const raw = atob(data);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
          bytes[i] = raw.charCodeAt(i);
        }

        if (bytes.length < 10) {
          resolve(null);
          return;
        }

        let rSum = 0,
          gSum = 0,
          bSum = 0,
          count = 0;

        const start = Math.floor(bytes.length * 0.3);
        const end = Math.floor(bytes.length * 0.9);
        for (let i = start; i + 2 < end; i += 3) {
          rSum += bytes[i];
          gSum += bytes[i + 1];
          bSum += bytes[i + 2];
          count++;
        }

        if (count === 0) {
          resolve(null);
          return;
        }

        const r = Math.round(rSum / count);
        const g = Math.round(gSum / count);
        const b = Math.round(bSum / count);
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        resolve(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function useDynamicAccent(): string {
  const coverUrl = usePlayerStore((s) => s.currentTrack?.coverUrl);
  const dynamicAccent = useSettingsStore((s) => s.dynamicAccent);
  const [color, setColor] = useState<string>(COLORS.accent);
  const lastUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!dynamicAccent || !coverUrl) {
      setColor(COLORS.accent);
      return;
    }

    if (coverUrl === lastUrlRef.current) return;
    lastUrlRef.current = coverUrl;

    const cached = cacheGet(coverUrl);
    if (cached) {
      setColor(cached);
      return;
    }

    let cancelled = false;

    extractColor(coverUrl)
      .then((hex) => {
        if (cancelled || !hex) return;
        const boosted = boostSaturation(hex);
        cacheSet(coverUrl, boosted);
        setColor(boosted);
      })
      .catch(() => {
        if (!cancelled) setColor(COLORS.accent);
      });

    return () => {
      cancelled = true;
    };
  }, [coverUrl, dynamicAccent]);

  return dynamicAccent ? color : COLORS.accent;
}
