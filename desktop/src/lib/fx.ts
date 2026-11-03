/**
 * Everything that happens to the sound between the file and the speakers:
 * sped up / slowed, reverb, the equalizer, volume normalization, crossfades
 * and the visualizer's taps.
 *
 * Speed is the element's own playbackRate with pitch preservation off, so
 * the pitch moves with the tempo the way the sped up / slowed edits sound.
 * Everything else is a Web Audio graph, built the first time something needs
 * it (with all of it off, the element plays straight to the output as before):
 *
 *   element A ─ norm ─ fade ┐
 *                           ├─ bus ─ EQ (10 bands) ─┬─ dry ─┬─ limiter ─ master ─ out
 *   element B ─ norm ─ fade ┘                       └─ reverb┘     └─ taps
 *
 * Two elements are there for crossfades: the next track starts on the other
 * one while this one fades out. Once an element feeds a graph it can't go
 * back, so from then on the volume lives in the graph as well. The convolver
 * is wired in only while reverb is on, so the rest costs no convolution.
 */

export type Fx = { speed: number; reverb: number };

export const FX_PRESETS = {
  off: { speed: 1, reverb: 0 },
  sped: { speed: 1.25, reverb: 0 },
  slowed: { speed: 0.85, reverb: 0.35 },
} satisfies Record<string, Fx>;

export type FxPreset = keyof typeof FX_PRESETS;

export function presetOf(fx: Fx): FxPreset | null {
  for (const [name, p] of Object.entries(FX_PRESETS)) {
    if (Math.abs(p.speed - fx.speed) < 0.001 && Math.abs(p.reverb - fx.reverb) < 0.001) return name as FxPreset;
  }
  return null;
}

/* ---------- equalizer ---------- */

/** Band centres, Hz: the usual ten octave bands of a graphic equalizer. */
export const EQ_BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;
/** How far a band moves either way, dB. */
export const EQ_RANGE = 12;

export const EQ_PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bass: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  vocal: [-2, -2, -1, 0, 2, 4, 4, 3, 1, 0],
  treble: [0, 0, 0, 0, 0, 1, 2, 4, 5, 6],
  electronic: [5, 4, 1, 0, -2, 0, 1, 3, 4, 5],
  acoustic: [3, 3, 2, 1, 1, 1, 2, 3, 2, 1],
} satisfies Record<string, number[]>;

export type EqPreset = keyof typeof EQ_PRESETS;

export function eqPresetOf(gains: number[]): EqPreset | null {
  for (const [name, p] of Object.entries(EQ_PRESETS)) {
    if (p.every((g, i) => Math.abs(g - (gains[i] ?? 0)) < 0.01)) return name as EqPreset;
  }
  return null;
}

/* ---------- loudness ---------- */

/**
 * Normalization aims every track at the same level, in dB of the mean power
 * of the louder passages (silence and quiet intros are gated out the way
 * EBU R 128 gates them). Commercial masters sit well above it, so they come
 * down; quiet uploads come up, with a limiter catching the peaks.
 */
const TARGET_DB = -14;
const MAX_CUT_DB = -12;
const MAX_BOOST_DB = 6;
/** A measurement is kept for a track after this much listening. */
const SAVE_AFTER_SEC = 30;
/** Live adjustment starts after this much listening, so the first beat is not a jump. */
const ADJUST_AFTER_SEC = 3;
const METER_MS = 250;
const LOUDNESS_KEY = 'exos.loudness';
const LOUDNESS_KEEP = 3000;

function loudnessStore(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(LOUDNESS_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

function saveLoudness(id: string, db: number) {
  try {
    const all = loudnessStore();
    delete all[id];
    all[id] = Math.round(db * 10) / 10;
    const keys = Object.keys(all);
    for (const k of keys.slice(0, Math.max(0, keys.length - LOUDNESS_KEEP))) delete all[k];
    localStorage.setItem(LOUDNESS_KEY, JSON.stringify(all));
  } catch {}
}

const dbToGain = (db: number) => 10 ** (db / 20);
const gainFor = (loudDb: number) => Math.max(MAX_CUT_DB, Math.min(MAX_BOOST_DB, TARGET_DB - loudDb));

/** Gated mean power of the blocks heard so far, in dB, or null before there is enough. */
function integrated(blocks: number[]): number | null {
  if (blocks.length < 4) return null;
  const mean = blocks.reduce((a, b) => a + b, 0) / blocks.length;
  const loud = blocks.filter((b) => b >= mean * 0.1);
  const m = loud.reduce((a, b) => a + b, 0) / Math.max(1, loud.length);
  return 10 * Math.log10(m);
}

/* ---------- graph ---------- */

/**
 * Where the visualizer listens: after the effects, before the volume, so the
 * picture shows what is heard and does not shrink with the volume slider.
 * `mono` is for the spectrum and the waveform, `left`/`right` for the meters.
 */
export type Taps = { ctx: AudioContext; mono: AnalyserNode; left: AnalyserNode; right: AnalyserNode };

type Channel = {
  el: HTMLAudioElement;
  norm: GainNode;
  fade: GainNode;
  meter: AnalyserNode;
  /** Track being measured on this element. */
  id: string | null;
  blocks: number[];
  heardSec: number;
  saved: boolean;
};

type Graph = {
  ctx: AudioContext;
  channels: Channel[];
  eq: BiquadFilterNode[];
  conv: ConvolverNode;
  dry: GainNode;
  wet: GainNode;
  mix: GainNode;
  limiter: DynamicsCompressorNode;
  master: GainNode;
  taps: Taps;
};

/** How long the reverb tail rings after reverb is turned off, before the convolver is unwired. */
const TAIL_MS = 4000;

/** Stereo noise with an exponential tail: a plain, roomy hall. */
function impulse(ctx: AudioContext, seconds = 3.2, decay = 2.6): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  const preDelay = Math.floor(ctx.sampleRate * 0.02);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = buf.getChannelData(ch);
    for (let i = preDelay; i < len; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - (i - preDelay) / (len - preDelay)) ** decay;
    }
  }
  return buf;
}

export type Sound = {
  fx: Fx;
  eqOn: boolean;
  eq: number[];
  normalize: boolean;
  /** Crossfade length in seconds; 0 is off. */
  crossfade: number;
};

export function createFx(elements: HTMLAudioElement[]) {
  let graph: Graph | null = null;
  let volume = 1;
  let sound: Sound = { fx: FX_PRESETS.off, eqOn: false, eq: [...EQ_PRESETS.flat], normalize: false, crossfade: 0 };
  let wantTaps = false;
  let meterTimer: ReturnType<typeof setInterval> | null = null;

  let wired = false;
  let unwire: ReturnType<typeof setTimeout> | null = null;

  const needsGraph = () =>
    wantTaps || sound.fx.reverb > 0 || (sound.eqOn && sound.eq.some((g) => g !== 0)) || sound.normalize || sound.crossfade > 0;

  const build = (): Graph => {
    const ctx = new AudioContext({ latencyHint: 'playback' });
    const bus = ctx.createGain();
    const channels = elements.map((el): Channel => {
      const src = ctx.createMediaElementSource(el);
      const norm = ctx.createGain();
      const fade = ctx.createGain();
      const meter = ctx.createAnalyser();
      meter.fftSize = 4096;
      src.connect(norm).connect(fade).connect(bus);
      src.connect(meter);
      el.volume = 1;
      return { el, norm, fade, meter, id: null, blocks: [], heardSec: 0, saved: false };
    });
    const eq = EQ_BANDS.map((f, i) => {
      const b = ctx.createBiquadFilter();
      b.type = i === 0 ? 'lowshelf' : i === EQ_BANDS.length - 1 ? 'highshelf' : 'peaking';
      b.frequency.value = f;
      b.Q.value = 1.1;
      b.gain.value = 0;
      return b;
    });
    let node: AudioNode = bus;
    for (const b of eq) node = node.connect(b);
    const mix = ctx.createGain();
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    const conv = ctx.createConvolver();
    conv.buffer = impulse(ctx);
    node.connect(dry).connect(mix);
    conv.connect(wet).connect(mix);
    const limiter = ctx.createDynamicsCompressor();
    const master = ctx.createGain();
    mix.connect(limiter).connect(master).connect(ctx.destination);

    const mono = ctx.createAnalyser();
    mono.fftSize = 4096;
    // The visualizer smooths over time itself, the same at any frame rate.
    mono.smoothingTimeConstant = 0;
    const split = ctx.createChannelSplitter(2);
    const left = ctx.createAnalyser();
    const right = ctx.createAnalyser();
    for (const a of [left, right]) {
      a.fftSize = 2048;
      a.smoothingTimeConstant = 0;
    }
    mix.connect(mono);
    mix.connect(split);
    split.connect(left, 0);
    split.connect(right, 1);

    // The reverb input is the EQ's output; remember it for wiring.
    (conv as ConvolverNode & { input?: AudioNode }).input = node;
    return { ctx, channels, eq, conv, dry, wet, mix, limiter, master, taps: { ctx, mono, left, right } };
  };

  const wire = (g: Graph, on: boolean) => {
    const input = (g.conv as ConvolverNode & { input?: AudioNode }).input!;
    if (unwire) clearTimeout(unwire);
    unwire = null;
    if (on && !wired) {
      input.connect(g.conv);
      wired = true;
    } else if (!on && wired) {
      unwire = setTimeout(() => {
        input.disconnect(g.conv);
        wired = false;
      }, TAIL_MS);
    }
  };

  const chan = (el: HTMLAudioElement) => graph?.channels.find((c) => c.el === el) ?? null;

  /* Loudness meter: a few blocks a second on each element that is playing. */
  const meterTick = () => {
    if (!graph) return;
    const buf = new Float32Array(4096);
    for (const c of graph.channels) {
      if (!c.id || c.el.paused) continue;
      c.meter.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i += 1) sum += buf[i] * buf[i];
      const ms = sum / buf.length;
      c.heardSec += METER_MS / 1000;
      // Absolute gate: digital silence and near-silence say nothing about level.
      if (ms > 1e-7) c.blocks.push(ms);
      if (c.blocks.length > 4000) c.blocks.splice(0, c.blocks.length - 4000);
      const loud = integrated(c.blocks);
      if (loud === null) continue;
      if (sound.normalize && c.heardSec >= ADJUST_AFTER_SEC && !c.saved) {
        c.norm.gain.setTargetAtTime(dbToGain(gainFor(loud)), graph.ctx.currentTime, 2);
      }
      if (c.heardSec >= SAVE_AFTER_SEC && !c.saved) {
        c.saved = true;
        saveLoudness(c.id, loud);
      }
    }
  };

  const applyNormalize = (g: Graph) => {
    const t = g.ctx.currentTime;
    const stored = loudnessStore();
    for (const c of g.channels) {
      const known = c.id ? stored[c.id] : undefined;
      // A track still being measured keeps the level the meter gave it.
      if (sound.normalize && known === undefined) continue;
      c.norm.gain.setTargetAtTime(sound.normalize && known !== undefined ? dbToGain(gainFor(known)) : 1, t, 0.05);
    }
    // The limiter only matters once tracks can be boosted.
    g.limiter.threshold.setTargetAtTime(sound.normalize ? -1.5 : 0, t, 0.05);
    g.limiter.ratio.setTargetAtTime(sound.normalize ? 20 : 1, t, 0.05);
    g.limiter.knee.value = 0;
    g.limiter.attack.value = 0.003;
    g.limiter.release.value = 0.15;
    meterTimer ??= setInterval(meterTick, METER_MS);
  };

  const apply = () => {
    for (const el of elements) {
      el.preservesPitch = sound.fx.speed === 1;
      el.defaultPlaybackRate = sound.fx.speed;
      el.playbackRate = sound.fx.speed;
    }
    if (!graph && needsGraph()) graph = build();
    if (!graph) {
      elements[0].volume = volume;
      return;
    }
    const g = graph;
    wire(g, sound.fx.reverb > 0);
    const t = g.ctx.currentTime;
    // Equal-power-ish mix: the dry signal backs off a little as the room grows.
    g.dry.gain.setTargetAtTime(1 - sound.fx.reverb * 0.45, t, 0.03);
    g.wet.gain.setTargetAtTime(sound.fx.reverb * 0.9, t, 0.03);
    g.eq.forEach((b, i) => b.gain.setTargetAtTime(sound.eqOn ? (sound.eq[i] ?? 0) : 0, t, 0.03));
    applyNormalize(g);
    g.master.gain.setTargetAtTime(volume, t, 0.015);
    if (g.ctx.state === 'suspended') void g.ctx.resume();
  };

  return {
    setVolume(v: number) {
      volume = v;
      if (graph) graph.master.gain.setTargetAtTime(v, graph.ctx.currentTime, 0.015);
      else elements[0].volume = v;
    },
    setSound(next: Sound) {
      sound = next;
      apply();
    },
    /** A new src resets the rate; call after every load. */
    reapply: apply,
    /** Crossfades need the graph (both elements' fades live in it). */
    canFade: () => !!graph,
    /** Starts measuring (and, when known, normalizing) a track on an element. */
    track(el: HTMLAudioElement, id: string) {
      const c = chan(el);
      if (!c || !graph) return;
      c.id = id;
      c.blocks = [];
      c.heardSec = 0;
      c.saved = false;
      const known = loudnessStore()[id];
      if (known !== undefined) c.saved = true;
      const target = sound.normalize && known !== undefined ? dbToGain(gainFor(known)) : 1;
      c.norm.gain.cancelScheduledValues(graph.ctx.currentTime);
      c.norm.gain.setValueAtTime(target, graph.ctx.currentTime);
    },
    /** Ramps an element's fade gain to `to` over `seconds` (0 sets it at once). */
    fade(el: HTMLAudioElement, to: number, seconds: number) {
      const c = chan(el);
      if (!c || !graph) return;
      const t = graph.ctx.currentTime;
      c.fade.gain.cancelScheduledValues(t);
      c.fade.gain.setValueAtTime(c.fade.gain.value, t);
      if (seconds <= 0) c.fade.gain.setValueAtTime(to, t);
      else c.fade.gain.linearRampToValueAtTime(to, t + seconds);
    },
    /** The visualizer's analysers; builds the graph the first time. */
    taps(): Taps {
      wantTaps = true;
      if (!graph) apply();
      return graph!.taps;
    },
  };
}
