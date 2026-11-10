import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';

import { GLASS } from '@/constants/glass';
import {
  afterMount,
  DESKTOP_SPRING,
  EASE_OUT,
  prefersReducedMotion,
  SHEET_SPRING,
} from '@/constants/motion';

/** A dismissal is quicker than an arrival: it starts fast and gets out of the way. */
const EXIT_MS = 220;

type PresenceProps = {
  visible: boolean;
  /**
   * `right` — pushed in from the right edge (pages).
   * `bottom` — presented from the bottom edge (player, profile, queue).
   * `rise` — fades up a short way (floating bars).
   */
  from: 'right' | 'bottom' | 'rise';
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'box-none' | 'auto';
  /**
   * False: if already visible on first render, start in place. For a layer
   * inside another Presence that arrives together with its parent.
   */
  appear?: boolean;
  children: ReactNode;
};

/** How far a `rise` travels. */
const RISE = 24;
/** How dark what is behind a full-screen layer gets while it is up. */
const SCRIM = 0.5;

/**
 * Keeps an overlay mounted for its exit and slides it in and out on React
 * Native's native driver. Replaces Reanimated layout animations, which on
 * Android commit the shadow tree on every frame of the slide.
 */
export function Presence({
  visible,
  from,
  style,
  pointerEvents,
  appear = true,
  children,
}: PresenceProps) {
  const { width, height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [progress] = useState(
    () => new Animated.Value(visible && !appear ? 1 : 0),
  );

  useEffect(() => {
    if (visible && !mounted) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const reduced = prefersReducedMotion();
    if (!visible) {
      const run = Animated.timing(progress, {
        toValue: 0,
        duration: reduced ? 0 : EXIT_MS,
        easing: EASE_OUT,
        useNativeDriver: true,
      });
      run.start(({ finished }) => {
        if (finished) setMounted(false);
      });
      return () => run.stop();
    }
    const run = reduced
      ? Animated.timing(progress, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        })
      : Animated.spring(progress, {
          toValue: 1,
          // A floating bar may bounce; a full-screen edge must not.
          ...(from === 'rise' ? DESKTOP_SPRING : SHEET_SPRING),
          useNativeDriver: true,
        });
    // The layer's content was mounted in this very commit: let it draw
    // first, so the slide doesn't start behind that work and jump.
    const cancel = afterMount(() => run.start());
    return () => {
      cancel();
      run.stop();
    };
  }, [visible, mounted, progress, from]);

  const motion = useMemo(() => {
    if (from === 'rise') {
      return {
        scrim: null,
        layer: {
          opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          }),
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [RISE, 0],
              }),
            },
          ],
        },
      };
    }
    // Clamped: the spring's overshoot must not pull the far edge into view.
    const offset = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [from === 'right' ? width : height, 0],
      extrapolate: 'clamp',
    });
    return {
      scrim: {
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, SCRIM],
          extrapolate: 'clamp',
        }),
      },
      layer: {
        transform: [
          from === 'right' ? { translateX: offset } : { translateY: offset },
        ],
      },
    };
  }, [progress, from, width, height]);

  if (!mounted) return null;

  return (
    <>
      {/* What is behind dims as the layer covers it and clears as it
          leaves, so the edge of a sliding page reads against the old one.
          Same stacking level as the layer, drawn just before it. */}
      {motion.scrim ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              zIndex: StyleSheet.flatten(style)?.zIndex,
              backgroundColor: GLASS.shadow,
            },
            motion.scrim,
          ]}
        />
      ) : null}
      <Animated.View
        pointerEvents={visible ? pointerEvents : 'none'}
        style={[style, motion.layer]}
      >
        {children}
      </Animated.View>
    </>
  );
}

/**
 * The last non-empty value: lets an overlay keep showing what it showed
 * while it slides away after the store has already cleared it.
 */
export function useHeld<T>(value: T | null | undefined): T | null | undefined {
  const held = useRef(value);
  if (value !== null && value !== undefined) held.current = value;
  return held.current;
}
