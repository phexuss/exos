import { Platform } from 'react-native';

/**
 * Design tokens for Glass mode — translucent "liquid glass" surfaces in the
 * spirit of iOS 26. A glass surface is built from three layers:
 *   1. a native blur of whatever is behind it,
 *   2. a translucent tint so text stays legible on any backdrop,
 *   3. a specular highlight (top-edge gradient + hairline rim) that sells
 *      the curved-glass look.
 */
export const GLASS = {
  tint: {
    regular: 'rgba(28,28,32,0.42)',
    thin: 'rgba(28,28,32,0.24)',
    thick: 'rgba(22,22,26,0.66)',
  },
  rim: 'rgba(255,255,255,0.16)',
  rimStrong: 'rgba(255,255,255,0.26)',
  highlightTop: 'rgba(255,255,255,0.14)',
  highlightBottom: 'rgba(255,255,255,0)',
  innerGlow: 'rgba(255,255,255,0.05)',
  selection: 'rgba(255,255,255,0.14)',
  scrim: 'rgba(0,0,0,0.28)',
  shadow: '#000000',
  blur: {
    // iOS materials already add their own vibrancy, Android needs more raw
    // blur radius to read as frosted glass.
    regular: Platform.OS === 'ios' ? 40 : 60,
    thin: Platform.OS === 'ios' ? 24 : 40,
    thick: Platform.OS === 'ios' ? 70 : 90,
    backdrop: Platform.OS === 'ios' ? 18 : 28,
  },
  radius: {
    capsule: 999,
    card: 24,
    sheet: 32,
    dialog: 28,
  },
} as const;

/** Spring presets tuned to feel like iOS UIKit springs. */
export const GLASS_SPRING = {
  /** Snappy, slight overshoot — selection bubbles, toggles. ~290ms to settle. */
  snappy: { damping: 24, stiffness: 360, mass: 0.9 },
  /** Presentations — sheets, overlays, cards. ~180ms to settle, barely any overshoot. */
  smooth: { damping: 30, stiffness: 380, mass: 1 },
  /** Press feedback — fast in, gentle settle. */
  press: { damping: 15, stiffness: 400, mass: 0.6 },
} as const;

export type GlassVariant = keyof typeof GLASS.tint;
