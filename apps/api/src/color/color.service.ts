import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ColorService {
  async getDominantColor(url: string): Promise<string> {
    if (!url) throw new BadRequestException('url query parameter is required');

    const res = await fetch(url);
    if (!res.ok) throw new BadRequestException('Failed to fetch image');

    const buffer = Buffer.from(await res.arrayBuffer());

    // Resize to 1x1 to get average color
    const { data } = await sharp(buffer)
      .resize(1, 1, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const [r, g, b] = data;

    // Boost saturation so muted covers still produce a vibrant accent
    const hex = this.boostSaturation(r, g, b);
    return hex;
  }

  private boostSaturation(r: number, g: number, b: number): string {
    let [h, s, l] = this.rgbToHsl(r, g, b);
    s = Math.min(1, s * 1.4 + 0.15);
    l = Math.max(0.35, Math.min(0.65, l));
    const [nr, ng, nb] = this.hslToRgb(h, s, l);
    return `#${this.hex(nr)}${this.hex(ng)}${this.hex(nb)}`;
  }

  private hex(n: number): string {
    return Math.round(n).toString(16).padStart(2, '0');
  }

  private rgbToHsl(r: number, g: number, b: number): [number, number, number] {
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

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    if (s === 0) {
      const v = l * 255;
      return [v, v, v];
    }
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
      hue2rgb(p, q, h + 1 / 3) * 255,
      hue2rgb(p, q, h) * 255,
      hue2rgb(p, q, h - 1 / 3) * 255,
    ];
  }
}
