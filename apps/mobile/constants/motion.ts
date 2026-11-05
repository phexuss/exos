import { AccessibilityInfo, Easing } from 'react-native';

/**
 * Motion tokens shared with the desktop app (desktop/src/styles/app.css,
 * `--dur-*`, `--stagger`, `--ease-*`). Same numbers, so a screen that
 * cascades in on the computer cascades in the same way on the phone.
 */
export const MOTION = {
  dur: {
    /** Press feedback, small state flips. */
    quick: 160,
    /** Hover-scale and card lifts. */
    base: 320,
    /** Screens, rows and text arriving. */
    slow: 520,
    /** Colour following the artwork. */
    glide: 900,
  },
  /** Delay between siblings in a cascade. */
  stagger: 45,
  /** Siblings after this many arrive together (desktop caps at the 9th). */
  staggerCap: 8,
  /** Desktop `@keyframes rise`: up from 14 px, from 98.5 % scale. */
  rise: { offsetY: 14, scale: 0.985 },
  /** Desktop `@keyframes route-in`: screens slide 32 px from the travel side. */
  routeShift: 32,
  /** Desktop `.np__tilt.is-paused`: the cover sinks back while paused. */
  pausedArtScale: 0.92,
  /** Desktop `.tt__row:active`: rows give a little under a press. */
  rowPressScale: 0.985,
  /** Desktop `@keyframes ring`: the play button breathes while music plays. */
  ring: { period: 2400, from: 0.55, scale: 1.55 },
} as const;

/**
 * Desktop `--ease-spring` as a physical spring. The desktop curve peaks at
 * 6 % overshoot about 40 % into a 520 ms run; a damping ratio of 0.67 gives
 * that overshoot and a natural frequency of 21 rad/s that peak time, hence
 * stiffness 21² ≈ 450 and damping 2 · 0.67 · 21 ≈ 28 at unit mass.
 */
export const DESKTOP_SPRING = { damping: 28, stiffness: 450, mass: 1 } as const;

/** Desktop `--ease-out`, for React Native `Animated` (JS/native driver). */
export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

/* ---------- reduced motion ---------- */

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((value) => {
    reduceMotion = value;
  })
  .catch(() => {});
AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
  reduceMotion = value;
});

/** The system "remove animations" switch, read without a re-render. */
export function prefersReducedMotion(): boolean {
  return reduceMotion;
}

/** Cascade delay for the n-th sibling. */
export function staggerDelay(index: number): number {
  return Math.min(Math.max(index, 0), MOTION.staggerCap) * MOTION.stagger;
}
