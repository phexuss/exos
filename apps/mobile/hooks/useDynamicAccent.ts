import { useEffect, useRef, useState } from 'react';

import { COLORS } from '@/constants/colors';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useSettingsStore } from '@/store/useSettingsStore';

const cache = new Map<string, string>();

/**
 * Convert RGB (0-255) to HSL (h: 0-1, s: 0-1, l: 0-1)
 */
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

/**
 * Convert HSL (0-1 each) back to RGB hex string
 */
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

/**
 * Parse a hex string (#rrggbb or #rgb) into [r, g, b]
 */
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

/**
 * Boost saturation and clamp lightness to produce a vibrant accent color
 */
function boostSaturation(hex: string): string {
  const [r, g, b] = parseHex(hex);
  let [h, s, l] = rgbToHsl(r, g, b);
  s = Math.min(1, s * 1.4 + 0.15);
  l = Math.max(0.35, Math.min(0.65, l));
  return hslToHex(h, s, l);
}

/**
 * Extract dominant color by sampling a tiny version of the image.
 * Pure JS — works in Expo Go, no native modules needed.
 *
 * TODO: replace with react-native-image-colors when building natively
 */
async function extractColor(url: string): Promise<string | null> {
  try {
    // Deezer: request a 1x1 pixel version
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
        // For JPEG/PNG, try to extract color from the raw data
        // Simple heuristic: sample bytes near the end of the data
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

        // For a 1x1 JPEG the last few bytes before EOI (0xFFD9)
        // contain the pixel data. For larger images, sample center.
        if (bytes.length < 10) {
          resolve(null);
          return;
        }

        // Fallback: Average of all byte triplets as rough color estimate
        let rSum = 0,
          gSum = 0,
          bSum = 0,
          count = 0;
        // Skip header bytes, sample from middle portion
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

    const cached = cache.get(coverUrl);
    if (cached) {
      setColor(cached);
      return;
    }

    let cancelled = false;

    extractColor(coverUrl)
      .then((hex) => {
        if (cancelled || !hex) return;
        const boosted = boostSaturation(hex);
        cache.set(coverUrl, boosted);
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
