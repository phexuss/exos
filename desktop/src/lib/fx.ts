/**
 * Sped up, slowed and reverb, live on whatever is playing.
 *
 * Speed is the element's own playbackRate with pitch preservation off, so
 * the pitch moves with the tempo the way the sped up / slowed edits sound.
 * Reverb is a Web Audio convolver fed a generated impulse; nothing is
 * rendered ahead of time, so a change is heard on the next audio block.
 *
 * The Web Audio graph is only built the first time reverb is turned on.
 * Once an element feeds a graph it can't go back, so from then on the gain
 * (volume) lives in the graph as well.
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

type Graph = { ctx: AudioContext; dry: GainNode; wet: GainNode; master: GainNode };

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

export function createFx(el: HTMLAudioElement) {
  let graph: Graph | null = null;
  let volume = 1;
  let fx: Fx = FX_PRESETS.off;

  const build = (): Graph => {
    const ctx = new AudioContext({ latencyHint: 'playback' });
    const src = ctx.createMediaElementSource(el);
    const master = ctx.createGain();
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    const conv = ctx.createConvolver();
    conv.buffer = impulse(ctx);
    src.connect(dry).connect(master);
    src.connect(conv).connect(wet).connect(master);
    master.connect(ctx.destination);
    el.volume = 1;
    return { ctx, dry, wet, master };
  };

  const apply = () => {
    el.preservesPitch = fx.speed === 1;
    el.defaultPlaybackRate = fx.speed;
    el.playbackRate = fx.speed;
    if (fx.reverb > 0 && !graph) graph = build();
    if (graph) {
      const t = graph.ctx.currentTime;
      // Equal-power-ish mix: the dry signal backs off a little as the room grows.
      graph.dry.gain.setTargetAtTime(1 - fx.reverb * 0.45, t, 0.03);
      graph.wet.gain.setTargetAtTime(fx.reverb * 0.9, t, 0.03);
      graph.master.gain.setTargetAtTime(volume, t, 0.015);
      if (graph.ctx.state === 'suspended') void graph.ctx.resume();
    } else {
      el.volume = volume;
    }
  };

  return {
    setVolume(v: number) {
      volume = v;
      if (graph) graph.master.gain.setTargetAtTime(v, graph.ctx.currentTime, 0.015);
      else el.volume = v;
    },
    setFx(next: Fx) {
      fx = next;
      apply();
    },
    /** A new src resets the rate; call after every load. */
    reapply: apply,
  };
}
