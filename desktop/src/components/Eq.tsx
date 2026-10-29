import { useEffect, useRef } from 'react';
import { reducedMotion } from '@/lib/motion';

/*
 * The four bars next to the playing track, looping like Spotify's. They are
 * not driven by the audio. Drawn on a canvas in whole device pixels: CSS
 * boxes land on fractional pixels at 125% or 150% display scaling, and the
 * bars came out with uneven widths. Each bar redraws only when its height
 * changes by a whole pixel, and nothing runs while paused.
 */

/** Sizes in CSS px at 100%. */
const BAR = 2;
const GAP = 2;
const HEIGHT = 14;
/** Each bar's loop: length in seconds and (time 0..1, height 0..1) keys. Different lengths, so the pattern never visibly repeats. */
const LOOPS: { s: number; keys: [number, number][] }[] = [
  { s: 1.1, keys: [[0, 0.3], [0.3, 0.95], [0.6, 0.5], [0.8, 0.75], [1, 0.3]] },
  { s: 0.9, keys: [[0, 0.6], [0.25, 0.25], [0.55, 1], [0.8, 0.4], [1, 0.6]] },
  { s: 1.3, keys: [[0, 0.45], [0.35, 0.8], [0.65, 0.2], [0.85, 0.65], [1, 0.45]] },
  { s: 1, keys: [[0, 0.4], [0.3, 0.85], [0.55, 0.3], [0.8, 0.9], [1, 0.4]] },
];
/** Heights when the system asks for less motion. */
const STILL = [0.55, 0.9, 0.4, 0.7];
/** How often the accent is re-read (it follows the artwork). */
const COLOUR_MS = 500;

/** Height of a loop at time t (seconds), eased between keys. */
function level(loop: (typeof LOOPS)[number], t: number) {
  const x = (t / loop.s) % 1;
  const { keys } = loop;
  let i = 1;
  while (i < keys.length - 1 && keys[i][0] < x) i += 1;
  const [x0, y0] = keys[i - 1];
  const [x1, y1] = keys[i];
  const u = (x - x0) / (x1 - x0);
  return y0 + (y1 - y0) * (0.5 - Math.cos(Math.PI * u) / 2);
}

type Instance = () => void;
const running = new Set<Instance>();
let raf = 0;
const tick = () => {
  raf = 0;
  for (const draw of running) draw();
  if (running.size) raf = requestAnimationFrame(tick);
};

export function Eq({ paused }: { paused?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = canvas.current;
    const g = el?.getContext('2d');
    if (!el || !g) return;
    let accent = '';
    let colourAt = -Infinity;
    let drawn = '';
    const draw = () => {
      const now = performance.now();
      const dpr = window.devicePixelRatio || 1;
      const bw = Math.max(1, Math.round(BAR * dpr));
      const gap = Math.max(1, Math.round(GAP * dpr));
      const h = Math.round(HEIGHT * dpr);
      const w = bw * 4 + gap * 3;
      const still = reducedMotion();
      const heights = LOOPS.map((l, i) => Math.max(1, Math.round(h * (still ? STILL[i] : level(l, now / 1000)))));
      if (now - colourAt > COLOUR_MS) {
        accent = getComputedStyle(el).getPropertyValue('--accent').trim() || accent;
        colourAt = now;
      }
      const key = `${w}x${h} ${accent} ${heights.join(',')}`;
      if (key === drawn) return;
      drawn = key;
      if (el.width !== w || el.height !== h) {
        el.width = w;
        el.height = h;
        el.style.width = `${w / dpr}px`;
        el.style.height = `${h / dpr}px`;
      }
      g.clearRect(0, 0, w, h);
      g.fillStyle = accent;
      for (let i = 0; i < 4; i += 1) g.fillRect(i * (bw + gap), h - heights[i], bw, heights[i]);
    };
    // Pausing keeps the frame it stopped on; only a fresh mount draws while paused.
    if (!paused || !started.current) draw();
    started.current = true;
    if (paused || reducedMotion()) return;
    running.add(draw);
    if (!raf) raf = requestAnimationFrame(tick);
    return () => {
      running.delete(draw);
    };
  }, [paused]);

  return <canvas ref={canvas} className="eq" aria-hidden="true" />;
}
