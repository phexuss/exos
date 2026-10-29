/**
 * One reading of the audio per frame, shared by every visualizer on screen.
 *
 * The analysers sit in the effects graph (src/lib/fx.ts). Nothing here runs
 * until a visualizer subscribes, and the loop goes to sleep once playback is
 * paused and the bars have fallen, so an idle window draws nothing. Values
 * are smoothed against the clock rather than per frame, so 60 Hz and 165 Hz
 * screens move the same.
 */
import { audioTaps, usePlayer } from '@/store/player';
import { IS_MOCK } from './env';

/** Spectrum bands, spaced evenly in octaves between these two frequencies. */
export const BANDS = 48;
const LOW_HZ = 40;
const HIGH_HZ = 16_000;
/** Spectrum range shown, dBFS, after the tilt below. */
const FLOOR_DB = -78;
const CEIL_DB = -18;
/** Music loses energy towards the highs; this much per octave above 1 kHz is added back so the right side moves too. */
const TILT_DB_PER_OCTAVE = 3;
/** Bars rise fast and fall slowly; time constants in seconds. Shorter ones read every FFT wobble as a jump. */
const ATTACK_S = 0.045;
const RELEASE_S = 0.28;
/** Each band is blended with its neighbours this much, so the outline reads as a shape, not a zigzag. */
const SPREAD = 0.2;
/**
 * A VU meter averages power over about 300 ms; this is the averaging time
 * constant. The needle's own swing is in the drawing (Visualizer.tsx).
 */
const VU_POWER_S = 0.15;
/** dBFS (RMS) that reads 0 VU. Mastered music sits close to it, so loud parts reach the red. */
export const VU_REF_DB = -10;

export type Frame = {
  /** Seconds since the previous frame. */
  dt: number;
  /** 0..1 per band, low to high. */
  bands: Float32Array;
  /** Left and right level, dBFS RMS with VU ballistics. */
  vu: Float32Array;
  /** 0..1, lows / mids / highs, for the small equalizer next to a playing track. */
  eq: Float32Array;
};

type Listener = (f: Frame) => void;

const frame: Frame = {
  dt: 0,
  bands: new Float32Array(BANDS),
  vu: new Float32Array([-90, -90]),
  eq: new Float32Array(3),
};
const listeners = new Set<Listener>();

let raf = 0;
let last = 0;
let spectrum: Float32Array<ArrayBuffer> | null = null;
let side: Float32Array<ArrayBuffer> | null = null;
/** Band edges in FFT bins, worked out once the sample rate is known. */
let edges: Float64Array | null = null;
let tilt: Float32Array | null = null;
const raw = new Float32Array(BANDS);
/** Mean-square level per channel, averaged over VU_POWER_S. */
const power = new Float64Array(2);

const ease = (cur: number, target: number, dt: number) => {
  const tau = target > cur ? ATTACK_S : RELEASE_S;
  return cur + (target - cur) * (1 - Math.exp(-dt / tau));
};

function prepare(sampleRate: number, fftSize: number) {
  const binHz = sampleRate / fftSize;
  edges = new Float64Array(BANDS + 1);
  tilt = new Float32Array(BANDS);
  for (let i = 0; i <= BANDS; i += 1) edges[i] = (LOW_HZ * (HIGH_HZ / LOW_HZ) ** (i / BANDS)) / binHz;
  for (let i = 0; i < BANDS; i += 1) {
    const centreHz = Math.sqrt(edges[i] * edges[i + 1]) * binHz;
    tilt[i] = TILT_DB_PER_OCTAVE * Math.log2(centreHz / 1000);
  }
}

const rms = (data: Float32Array) => {
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) sum += data[i] * data[i];
  return Math.sqrt(sum / data.length);
};
const toDb = (x: number) => (x > 1e-6 ? 20 * Math.log10(x) : -120);

/**
 * The analysers hear the audio before it reaches the speakers; with the
 * graph's output latency that is a beat's worth early. Readings wait in this
 * ring until the speakers catch up.
 */
type Reading = { at: number; bands: Float32Array; l: number; r: number };
const RING = 64;
const ring: Reading[] = Array.from({ length: RING }, () => ({
  at: 0,
  bands: new Float32Array(BANDS),
  l: -120,
  r: -120,
}));
let head = 0;

function sample(now: number): Reading | null {
  const taps = audioTaps();
  if (!taps) return null;
  const { ctx, mono, left, right } = taps;
  if (!edges || !tilt) prepare(ctx.sampleRate, mono.fftSize);
  spectrum ??= new Float32Array(mono.frequencyBinCount);
  side ??= new Float32Array(left.fftSize);
  const slot = ring[head];
  head = (head + 1) % RING;
  slot.at = now;
  mono.getFloatFrequencyData(spectrum);
  const e = edges as Float64Array;
  const k = tilt as Float32Array;
  for (let i = 0; i < BANDS; i += 1) {
    const from = Math.floor(e[i]);
    const to = Math.max(from + 1, Math.ceil(e[i + 1]));
    // Mean power across the band's bins: a single loud bin no longer flicks the bar.
    let sum = 0;
    let n = 0;
    for (let b = from; b < to && b < spectrum.length; b += 1, n += 1) sum += 10 ** (spectrum[b] / 10);
    const db = n ? 10 * Math.log10(sum / n || 1e-12) : -120;
    raw[i] = Math.min(1, Math.max(0, (db + k[i] - FLOOR_DB) / (CEIL_DB - FLOOR_DB)));
  }
  for (let i = 0; i < BANDS; i += 1) {
    const a = raw[Math.max(0, i - 1)];
    const b = raw[Math.min(BANDS - 1, i + 1)];
    slot.bands[i] = raw[i] * (1 - 2 * SPREAD) + (a + b) * SPREAD;
  }
  left.getFloatTimeDomainData(side);
  slot.l = toDb(rms(side));
  right.getFloatTimeDomainData(side);
  slot.r = toDb(rms(side));
  // A mono file comes out on the left channel only.
  if (slot.r <= -120 && slot.l > -120) slot.r = slot.l;

  const delayMs = ((ctx.outputLatency || 0) + ctx.baseLatency) * 1000;
  let pick: Reading = slot;
  for (let n = 1; n <= RING; n += 1) {
    const r = ring[(head - n + RING) % RING];
    if (!r.at) break;
    pick = r;
    if (r.at <= now - delayMs) break;
  }
  return pick;
}

/** Real readings from the analysers. */
function read(dt: number, playing: boolean, now: number) {
  const got = playing ? sample(now) : null;
  if (!playing) for (const r of ring) r.at = 0;
  for (let i = 0; i < BANDS; i += 1) frame.bands[i] = ease(frame.bands[i], got ? got.bands[i] : 0, dt);
  vuFrom(got ? got.l : -120, got ? got.r : -120, dt);
}

/** Averages power, not decibels, the way a VU meter's rectifier does. */
function vuFrom(l: number, r: number, dt: number) {
  const a = 1 - Math.exp(-dt / VU_POWER_S);
  power[0] += (10 ** (l / 10) - power[0]) * a;
  power[1] += (10 ** (r / 10) - power[1]) * a;
  frame.vu[0] = Math.max(-90, 10 * Math.log10(power[0] || 1e-12));
  frame.vu[1] = Math.max(-90, 10 * Math.log10(power[1] || 1e-12));
}

/** In the browser preview there is no audio: a steady groove so the drawings can be seen. */
function fake(dt: number, playing: boolean, now: number) {
  const s = now / 1000;
  const beat = (s * 2) % 1;
  const kick = playing ? Math.exp(-beat * 7) : 0;
  for (let i = 0; i < BANDS; i += 1) {
    const x = i / BANDS;
    const target = playing
      ? Math.min(1, 0.22 + 0.62 * kick * (1 - x) ** 2 + 0.2 * (0.5 + 0.5 * Math.sin(s * 5.3 + i * 0.7)) * (1 - x * 0.6) + 0.08 * Math.sin(s * 11 + i * 2.1))
      : 0;
    frame.bands[i] = ease(frame.bands[i], Math.max(0, target), dt);
  }
  const level = playing ? VU_REF_DB - 6 + 7 * kick : -120;
  vuFrom(level, level - 1.5, dt);
}

function settled() {
  for (let i = 0; i < BANDS; i += 1) if (frame.bands[i] > 0.002) return false;
  return frame.vu[0] < -80 && frame.vu[1] < -80;
}

function tick(now: number) {
  raf = 0;
  if (!listeners.size) return;
  frame.dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
  last = now;
  const playing = usePlayer.getState().status === 'playing';
  if (IS_MOCK) fake(frame.dt, playing, now);
  else read(frame.dt, playing, now);
  const third = BANDS / 3;
  for (let j = 0; j < 3; j += 1) {
    let peak = 0;
    for (let i = Math.floor(j * third); i < Math.floor((j + 1) * third); i += 1) peak = Math.max(peak, frame.bands[i]);
    frame.eq[j] = peak;
  }
  for (const fn of listeners) fn(frame);
  // Paused and fallen: stop until playback starts again.
  if (!playing && settled()) {
    last = 0;
    return;
  }
  raf = requestAnimationFrame(tick);
}

const wake = () => {
  if (!raf && listeners.size) raf = requestAnimationFrame(tick);
};

usePlayer.subscribe((s, prev) => {
  if (s.status !== prev.status) wake();
});

/** Calls `fn` with the shared frame every animation frame while anything is playing. */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  wake();
  return () => {
    listeners.delete(fn);
    if (!listeners.size && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    }
  };
}
