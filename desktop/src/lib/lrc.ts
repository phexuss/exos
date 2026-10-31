export type LyricLine = { time: number; text: string };

/** A time tag: [mm:ss], [mm:ss.xx], [mm:ss.xxx], and the [mm:ss:xx] some editors write. */
const STAMP = /\[(\d+):(\d+)(?:[.:](\d+))?\]/g;

const stampSeconds = (m: string, s: string, frac?: string) =>
  Number(m) * 60 + Number(s) + (frac ? Number(`0.${frac}`) : 0);

export function parseLrc(lrc: string): LyricLine[] {
  // [offset:+500] means the words come 0.5 s sooner than the tags say.
  const offset = Number(/\[offset:\s*([+-]?\d+)\s*\]/i.exec(lrc)?.[1] ?? 0) / 1000;
  const lines: LyricLine[] = [];
  for (const raw of lrc.split('\n')) {
    const stamps = [...raw.matchAll(STAMP)];
    if (stamps.length === 0) continue;
    const text = raw.replace(/\[[^\]]*\]/g, '').trim();
    for (const s of stamps) {
      lines.push({ time: Math.max(0, stampSeconds(s[1], s[2], s[3]) - offset), text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

export function activeLineIndex(lines: LyricLine[], time: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= time + 0.15) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

/** [mm:ss.xx], the form nearly every player reads. */
export function lrcStamp(sec: number): string {
  const cs = Math.max(0, Math.round(sec * 100));
  const m = Math.floor(cs / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  return `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}]`;
}

export function toLrc(lines: LyricLine[]): string {
  return lines.map((l) => `${lrcStamp(l.time)}${l.text}`).join('\n');
}

/** SubRip (.srt): numbered blocks with "00:01:02,345 --> 00:01:05,000" and the text under it. */
function srtToLines(srt: string): LyricLine[] {
  const out: LyricLine[] = [];
  for (const block of srt.replace(/\r/g, '').split(/\n{2,}/)) {
    const rows = block.split('\n');
    const at = rows.findIndex((r) => r.includes('-->'));
    const m = at >= 0 ? /(\d+):(\d+):(\d+)[,.](\d+)/.exec(rows[at]) : null;
    if (!m) continue;
    const text = rows
      .slice(at + 1)
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .trim();
    out.push({ time: Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(`0.${m[4]}`), text });
  }
  return out;
}

export type ParsedLyrics =
  | { kind: 'empty' }
  | { kind: 'synced'; lrc: string; lines: LyricLine[]; from: 'lrc' | 'srt' }
  | { kind: 'plain'; text: string; lines: string[] };

/**
 * Whatever was pasted or opened, read as one of: LRC (time tags), SRT (turned
 * into LRC), or plain text. Plain text keeps its blank lines; they separate verses.
 */
export function readLyrics(input: string): ParsedLyrics {
  const text = input.replace(/\r\n?/g, '\n').replace(/^﻿/, '').trim();
  if (!text) return { kind: 'empty' };
  const lrc = parseLrc(text);
  if (lrc.length) return { kind: 'synced', lrc: text, lines: lrc, from: 'lrc' };
  if (/\d+:\d+:\d+[,.]\d+\s*-->/.test(text)) {
    const lines = srtToLines(text);
    if (lines.length) return { kind: 'synced', lrc: toLrc(lines), lines, from: 'srt' };
  }
  return { kind: 'plain', text, lines: text.split('\n').filter((l) => l.trim()) };
}

/** The words alone: time tags and LRC header tags ([ar:], [ti:], …) stripped. */
export function plainFrom(input: string): string {
  const parsed = readLyrics(input);
  if (parsed.kind === 'empty') return '';
  if (parsed.kind === 'plain') return parsed.text;
  return parsed.lines.map((l) => l.text).join('\n');
}
