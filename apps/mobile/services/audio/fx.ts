/**
 * Sped up / slowed + reverb, the same presets as the desktop app
 * (desktop/src/lib/fx.ts). On Android the pitch moves with the speed and the
 * reverb is a hall on the output mix; see the react-native-track-player patch.
 */
export type Fx = { speed: number; reverb: number };

export const FX_PRESETS = {
  off: { speed: 1, reverb: 0 },
  sped: { speed: 1.25, reverb: 0 },
  slowed: { speed: 0.85, reverb: 0.35 },
} satisfies Record<string, Fx>;

export type FxPreset = keyof typeof FX_PRESETS;

export const FX_SPEED_MIN = 0.5;
export const FX_SPEED_MAX = 1.5;

export function presetOf(fx: Fx): FxPreset | null {
  for (const [name, p] of Object.entries(FX_PRESETS)) {
    if (
      Math.abs(p.speed - fx.speed) < 0.001 &&
      Math.abs(p.reverb - fx.reverb) < 0.001
    ) {
      return name as FxPreset;
    }
  }
  return null;
}

export function clampFx(fx: Partial<Fx>, base: Fx): Fx {
  const speed = Number.isFinite(fx.speed) ? (fx.speed as number) : base.speed;
  const reverb = Number.isFinite(fx.reverb)
    ? (fx.reverb as number)
    : base.reverb;
  return {
    speed: Math.min(FX_SPEED_MAX, Math.max(FX_SPEED_MIN, speed)),
    reverb: Math.min(1, Math.max(0, reverb)),
  };
}
