import { useEffect, useRef } from 'react';
import { reducedMotion } from '@/lib/motion';
import { BANDS, type Frame, subscribe, VU_REF_DB, WAVE } from '@/lib/visualizer';
import { useSettings } from '@/store/settings';

export type VizKind = 'bars' | 'wave' | 'vu';

/** Visualizers are on unless turned off in settings or the system asks for less motion. */
export function useVizOn() {
  const on = useSettings((s) => s.visualizer);
  return on && !reducedMotion();
}

/** Calls `draw` every frame while `active`; the latest `draw` is used without resubscribing. */
export function useAudioFrames(draw: (f: Frame) => void, active: boolean) {
  const ref = useRef(draw);
  ref.current = draw;
  useEffect(() => {
    if (!active) return;
    return subscribe((f) => ref.current(f));
  }, [active]);
}

/* Drawing sizes, in CSS pixels; scaled by the device pixel ratio. */
const BAR_GAP = 3;
const BAR_RADIUS = 3;
const BAR_MIN = 2;
const PEAK_H = 2;
/** Peak caps fall this fraction of the height per second. */
const PEAK_FALL = 0.45;
const WAVE_LINE = 2;
const WAVE_GAIN = 0.9;
const NEEDLE_LINE = 1.5;
const TICK_LINE = 1;
const RED_LINE = 3;
const LABEL_PX = 10;
/** Half of the VU scale's sweep, from straight up. */
const VU_SWEEP = (50 * Math.PI) / 180;
/** VU scale marks; numbers are labelled. */
const VU_MARKS = [-20, -10, -7, -5, -3, -2, -1, 0, 1, 2, 3];
const VU_LABELS = new Set([-20, -10, -5, 0, 3]);
/** How often the colours are re-read (the accent follows the artwork). */
const COLOUR_MS = 500;

const lin = (db: number) => 10 ** (db / 20);
/** A VU needle moves with voltage, not decibels: 0 VU sits about two thirds along. */
const vuPos = (vu: number) => (lin(vu) - lin(-20)) / (lin(3) - lin(-20));

type Colours = { accent: string; text: string; faint: string; danger: string; font: string; at: number };

function readColours(el: Element, c: Colours, now: number) {
  if (now - c.at < COLOUR_MS) return;
  const s = getComputedStyle(el);
  c.accent = s.getPropertyValue('--accent').trim() || c.accent;
  c.text = s.getPropertyValue('--text-strong').trim() || c.text;
  c.faint = s.getPropertyValue('--text-4').trim() || c.faint;
  c.danger = s.getPropertyValue('--danger').trim() || c.danger;
  c.font = s.fontFamily;
  c.at = now;
}

function bars(g: CanvasRenderingContext2D, f: Frame, w: number, h: number, dpr: number, c: Colours, peaks: Float32Array) {
  const gap = BAR_GAP * dpr;
  const bw = (w - gap * (BANDS - 1)) / BANDS;
  const r = Math.min(bw / 2, BAR_RADIUS * dpr);
  // Whole device pixels, so every bar is the same width at any display scaling.
  const left = (i: number) => Math.round(i * (bw + gap));
  const width = (i: number) => Math.round(i * (bw + gap) + bw) - left(i);
  g.fillStyle = c.accent;
  g.beginPath();
  for (let i = 0; i < BANDS; i += 1) {
    const bh = Math.round(Math.max(BAR_MIN * dpr, f.bands[i] * h));
    g.roundRect(left(i), h - bh, width(i), bh, [r, r, 0, 0]);
  }
  g.fill();
  g.fillStyle = c.text;
  g.beginPath();
  for (let i = 0; i < BANDS; i += 1) {
    peaks[i] = Math.max(f.bands[i], peaks[i] - PEAK_FALL * f.dt);
    if (peaks[i] * h < BAR_MIN * dpr * 2) continue;
    g.rect(left(i), Math.round(h - peaks[i] * h - PEAK_H * dpr * 2), width(i), Math.round(PEAK_H * dpr));
  }
  g.fill();
}

function wave(g: CanvasRenderingContext2D, f: Frame, w: number, h: number, dpr: number, c: Colours) {
  const mid = h / 2;
  g.strokeStyle = c.faint;
  g.lineWidth = TICK_LINE * dpr;
  g.beginPath();
  g.moveTo(0, mid);
  g.lineTo(w, mid);
  g.stroke();
  // Start at a rising zero crossing, the way a scope triggers, so the shape holds still.
  const span = WAVE / 2;
  let start = 0;
  for (let i = 1; i < WAVE - span; i += 1) {
    if (f.wave[i - 1] < 0 && f.wave[i] >= 0) {
      start = i;
      break;
    }
  }
  const points = Math.max(2, Math.floor(w / (2 * dpr)));
  g.strokeStyle = c.accent;
  g.lineWidth = WAVE_LINE * dpr;
  g.lineJoin = 'round';
  g.beginPath();
  for (let p = 0; p < points; p += 1) {
    const s = f.wave[start + Math.floor((p / (points - 1)) * (span - 1))];
    const x = (p / (points - 1)) * w;
    const yy = mid - Math.max(-1, Math.min(1, s * WAVE_GAIN)) * mid;
    p ? g.lineTo(x, yy) : g.moveTo(x, yy);
  }
  g.stroke();
}

function meter(g: CanvasRenderingContext2D, level: number, label: string, x: number, w: number, h: number, dpr: number, c: Colours) {
  const cx = x + w / 2;
  const cy = h;
  const R = Math.min(h * 0.9, (w * 0.9) / (2 * Math.sin(VU_SWEEP)));
  const angle = (p: number) => -Math.PI / 2 - VU_SWEEP + p * 2 * VU_SWEEP;
  const at = (a: number, rr: number) => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as const;

  // Red zone, 0 to +3 VU.
  g.strokeStyle = c.danger;
  g.lineWidth = RED_LINE * dpr;
  g.beginPath();
  g.arc(cx, cy, R * 0.9, angle(vuPos(0)), angle(1));
  g.stroke();

  g.strokeStyle = c.faint;
  g.lineWidth = TICK_LINE * dpr;
  g.beginPath();
  g.arc(cx, cy, R * 0.9, angle(0), angle(vuPos(0)));
  for (const m of VU_MARKS) {
    const a = angle(vuPos(m));
    const [x0, y0] = at(a, R * 0.9);
    const [x1, y1] = at(a, R * (VU_LABELS.has(m) ? 1 : 0.96));
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
  }
  g.stroke();

  g.fillStyle = c.faint;
  g.font = `${LABEL_PX * dpr}px ${c.font}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const m of VU_LABELS) {
    const [lx, ly] = at(angle(vuPos(m)), R * 0.78);
    g.fillText(m > 0 ? `+${m}` : String(m), lx, ly);
  }
  g.fillText(label, cx, cy - R * 0.35);

  const p = Math.max(-0.02, Math.min(1.02, vuPos(level - VU_REF_DB)));
  const [nx, ny] = at(angle(p), R * 0.98);
  g.strokeStyle = level - VU_REF_DB > 0 ? c.danger : c.text;
  g.lineWidth = NEEDLE_LINE * dpr;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(cx, cy);
  g.lineTo(nx, ny);
  g.stroke();
}

export function Visualizer({ kind, className = '' }: { kind: VizKind; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const on = useVizOn();
  const peaks = useRef(new Float32Array(BANDS));
  const colours = useRef<Colours>({ accent: '#818cf8', text: '#fff', faint: '#888', danger: '#f87171', font: 'sans-serif', at: 0 });

  useEffect(() => {
    const el = canvas.current;
    if (!on || !el) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      el.width = Math.max(1, Math.round(el.clientWidth * dpr));
      el.height = Math.max(1, Math.round(el.clientHeight * dpr));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [on]);

  useAudioFrames((f) => {
    const el = canvas.current;
    const g = el?.getContext('2d');
    if (!el || !g) return;
    const dpr = window.devicePixelRatio || 1;
    const { width: w, height: h } = el;
    readColours(el, colours.current, performance.now());
    g.clearRect(0, 0, w, h);
    if (kind === 'bars') bars(g, f, w, h, dpr, colours.current, peaks.current);
    else if (kind === 'wave') wave(g, f, w, h, dpr, colours.current);
    else {
      const half = w / 2;
      meter(g, f.vu[0], 'L', 0, half, h, dpr, colours.current);
      meter(g, f.vu[1], 'R', half, half, h, dpr, colours.current);
    }
  }, on);

  if (!on) return null;
  return <canvas ref={canvas} className={`viz viz--${kind} ${className}`} aria-hidden="true" />;
}

/* The three bars next to the playing track; sizes match `.eq` in app.css. */
const EQ_BAR = 3;
const EQ_GAP = 2;
const EQ_H = 14;
const EQ_RADIUS = 1;
/** Lowest height of a bar, as a fraction of the full one. */
const EQ_REST = 0.25;

/**
 * Drawn on a canvas in whole device pixels: thin bars scaled with CSS
 * transforms land on fractional pixels under display scaling (125%, 150%)
 * and come out uneven and blurred.
 */
export function LiveEq() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const colours = useRef<Colours>({ accent: '#818cf8', text: '#fff', faint: '#888', danger: '#f87171', font: 'sans-serif', at: 0 });
  useAudioFrames((f) => {
    const el = canvas.current;
    const g = el?.getContext('2d');
    if (!el || !g) return;
    const dpr = window.devicePixelRatio || 1;
    const bw = Math.max(1, Math.round(EQ_BAR * dpr));
    const gap = Math.max(1, Math.round(EQ_GAP * dpr));
    const h = Math.round(EQ_H * dpr);
    const w = bw * 3 + gap * 2;
    if (el.width !== w || el.height !== h) {
      el.width = w;
      el.height = h;
      el.style.width = `${w / dpr}px`;
      el.style.height = `${h / dpr}px`;
    }
    readColours(el, colours.current, performance.now());
    g.clearRect(0, 0, w, h);
    g.fillStyle = colours.current.accent;
    g.beginPath();
    for (let i = 0; i < 3; i += 1) {
      const bh = Math.round(h * (EQ_REST + (1 - EQ_REST) * f.eq[i]));
      g.roundRect(i * (bw + gap), h - bh, bw, bh, Math.round(EQ_RADIUS * dpr));
    }
    g.fill();
  }, true);
  return <canvas ref={canvas} className="eq eq--live" aria-hidden="true" />;
}
