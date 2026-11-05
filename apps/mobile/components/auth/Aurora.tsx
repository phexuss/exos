import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { COLORS } from '@/constants/colors';
import { prefersReducedMotion } from '@/constants/motion';
import { SOURCES } from '@/constants/sources';

/** One way of the drift, desktop `--drift`. */
const DRIFT_MS = 24000;
/** Blob diameter as a share of the longer screen side (desktop 70vmax). */
const BLOB = 0.7;
/** How far a blob travels and grows by the end of a drift (desktop keyframes). */
const TRAVEL_X = 0.08;
const TRAVEL_Y = 0.06;
const GROW = 1.15;

type Blob = {
  id: string;
  color: string;
  /** Peak opacity at the centre of the glow. */
  alpha: number;
  /** Position as shares of vmax, like the desktop `.aurora i` rules. */
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  /** Drifts back while the others drift out (`alternate-reverse`). */
  reverse?: boolean;
};

const BLOBS: Blob[] = [
  {
    id: 'a',
    color: COLORS.accent,
    alpha: 0.42,
    left: -0.2,
    top: -0.25,
  },
  {
    id: 'b',
    color: SOURCES.deezer.color,
    alpha: 0.3,
    right: -0.25,
    bottom: -0.3,
    reverse: true,
  },
  {
    id: 'c',
    color: SOURCES.soundcloud.color,
    alpha: 0.18,
    left: 0.2,
    bottom: -0.4,
  },
];

// Native-driver interpolation can't take an easing function, so the
// ease-in-out of the desktop keyframes is sampled into the ranges: one clock
// runs 0 → 2 per there-and-back, and every blob maps it to 0 → 1 → 0.
const SAMPLES = 8;
const CLOCK_IN: number[] = [];
const OUT: number[] = [];
for (let i = 0; i <= SAMPLES * 2; i++) {
  const t = i / SAMPLES;
  CLOCK_IN.push(t);
  const x = t <= 1 ? t : 2 - t;
  OUT.push((1 - Math.cos(Math.PI * x)) / 2);
}
const OUT_REVERSED = OUT.map((v) => 1 - v);

// The clock is anchored to app time, not to the screen, so the glow stays
// where it was when the sign-in screens replace one another.
const EPOCH = Date.now();
function clockNow() {
  return ((Date.now() - EPOCH) % (DRIFT_MS * 2)) / DRIFT_MS;
}

/**
 * Desktop sign-in backdrop: three soft glows (accent, Deezer, SoundCloud)
 * drifting slowly on near-black. Each glow is drawn once as an SVG and only
 * moved by native-driver transforms, so the drift costs no JS and no redraw.
 */
export function Aurora() {
  const { width, height } = useWindowDimensions();
  const vmax = Math.max(width, height);
  const size = Math.round(vmax * BLOB);
  const [clock] = useState(() => new Animated.Value(clockNow()));

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let current: Animated.CompositeAnimation | null = null;
    let alive = true;
    const from = clockNow();
    clock.setValue(from);
    // Finish the running lap from where app time says it is, then loop
    // full laps.
    current = Animated.timing(clock, {
      toValue: 2,
      duration: (2 - from) * DRIFT_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    current.start(({ finished }) => {
      if (!finished || !alive) return;
      clock.setValue(0);
      current = Animated.loop(
        Animated.timing(clock, {
          toValue: 2,
          duration: DRIFT_MS * 2,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      current.start();
    });
    return () => {
      alive = false;
      current?.stop();
    };
  }, [clock]);

  const blobs = useMemo(
    () =>
      BLOBS.map((b) => {
        const p = clock.interpolate({
          inputRange: CLOCK_IN,
          outputRange: b.reverse ? OUT_REVERSED : OUT,
        });
        return {
          ...b,
          style: {
            transform: [
              {
                translateX: p.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, vmax * TRAVEL_X],
                }),
              },
              {
                translateY: p.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, vmax * TRAVEL_Y],
                }),
              },
              {
                scale: p.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, GROW],
                }),
              },
            ],
          },
        };
      }),
    [clock, vmax],
  );

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.root]}>
      {blobs.map((b) => (
        <Animated.View
          key={b.id}
          style={[
            {
              position: 'absolute',
              width: size,
              height: size,
              left: b.left === undefined ? undefined : b.left * vmax,
              right: b.right === undefined ? undefined : b.right * vmax,
              top: b.top === undefined ? undefined : b.top * vmax,
              bottom: b.bottom === undefined ? undefined : b.bottom * vmax,
            },
            b.style,
          ]}
        >
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id={`aurora-${b.id}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={b.color} stopOpacity={b.alpha} />
                <Stop offset="1" stopColor={b.color} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2}
              fill={`url(#aurora-${b.id})`}
            />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: COLORS.ink, overflow: 'hidden' },
});
