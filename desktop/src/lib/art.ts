/**
 * Abstract cover art for the design prototype, generated from a seed so every
 * example album looks distinct without shipping real artwork. Not used with
 * real API data, where covers come from Deezer and SoundCloud.
 */

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const STYLES = ['orbs', 'bands', 'sun', 'grid'] as const;

export function generatedCover(seed: string, size = 600): string {
  const r = rng(seed);
  const hue = Math.floor(r() * 360);
  const hue2 = (hue + 30 + Math.floor(r() * 140)) % 360;
  const hue3 = (hue + 180 + Math.floor(r() * 60)) % 360;
  const style = STYLES[Math.floor(r() * STYLES.length)];
  const s = size;
  const c = (h: number, sat: number, l: number, a = 1) => `hsla(${h},${sat}%,${l}%,${a})`;

  let shapes = '';
  if (style === 'orbs') {
    for (let i = 0; i < 5; i += 1) {
      const x = r() * s;
      const y = r() * s;
      const rad = s * (0.18 + r() * 0.35);
      const h = [hue, hue2, hue3][i % 3];
      shapes += `<circle cx="${x}" cy="${y}" r="${rad}" fill="${c(h, 75, 55, 0.85)}" filter="url(#b)"/>`;
    }
  } else if (style === 'bands') {
    const n = 5 + Math.floor(r() * 5);
    for (let i = 0; i < n; i += 1) {
      const y = (i / n) * s;
      const h = i % 2 ? hue2 : hue;
      shapes += `<rect x="-20" y="${y}" width="${s + 40}" height="${s / n + 2}" fill="${c(h, 65, 30 + (i / n) * 40)}" transform="rotate(${-12 + r() * 24} ${s / 2} ${s / 2})"/>`;
    }
    shapes += `<circle cx="${s * (0.3 + r() * 0.4)}" cy="${s * (0.3 + r() * 0.4)}" r="${s * 0.18}" fill="${c(hue3, 80, 62)}"/>`;
  } else if (style === 'sun') {
    shapes += `<rect width="${s}" height="${s * 0.62}" fill="${c(hue, 60, 22)}"/>`;
    shapes += `<circle cx="${s / 2}" cy="${s * 0.62}" r="${s * 0.3}" fill="${c(hue2, 85, 60)}"/>`;
    for (let i = 0; i < 6; i += 1) {
      shapes += `<rect y="${s * 0.62 + i * s * 0.065}" width="${s}" height="${s * 0.03}" fill="${c(hue3, 55, 18)}"/>`;
    }
  } else {
    const n = 6;
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        if (r() < 0.45) continue;
        const h = r() < 0.5 ? hue : hue2;
        shapes += `<rect x="${(i * s) / n}" y="${(j * s) / n}" width="${s / n}" height="${s / n}" rx="${r() < 0.5 ? s / n / 2 : 0}" fill="${c(h, 70, 35 + r() * 35)}"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c(hue, 55, 26)}"/><stop offset="1" stop-color="${c(hue3, 50, 12)}"/></linearGradient>
<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s * 0.06}"/></filter>
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.09 0"/></filter>
</defs>
<rect width="${s}" height="${s}" fill="url(#g)"/>${shapes}
<rect width="${s}" height="${s}" filter="url(#n)"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
