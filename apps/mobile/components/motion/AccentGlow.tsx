import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { COLORS } from '@/constants/colors';
import { EASE_OUT, MOTION, prefersReducedMotion } from '@/constants/motion';

type AccentGlowProps = {
  color: string;
  opacity: number;
};

/**
 * The accent wash from the top of the screen into the background. When the
 * artwork, and with it the accent, changes, the new wash fades in over the
 * old one instead of switching, like the desktop `--accent` transition.
 */
export function AccentGlow({ color, opacity }: AccentGlowProps) {
  const [layers, setLayers] = useState({ under: color, over: color });
  const [fade] = useState(() => new Animated.Value(1));
  const shown = useRef(color);

  useEffect(() => {
    if (color === shown.current) return;
    shown.current = color;
    if (prefersReducedMotion()) {
      setLayers({ under: color, over: color });
      return;
    }
    setLayers((now) => ({ under: now.over, over: color }));
    fade.setValue(0);
    const run = Animated.timing(fade, {
      toValue: 1,
      duration: MOTION.dur.glide,
      easing: EASE_OUT,
      useNativeDriver: true,
    });
    // Settle with both layers on the new colour, so the next change fades
    // from exactly what is on screen.
    run.start(({ finished }) => {
      if (finished) setLayers({ under: color, over: color });
    });
    return () => run.stop();
  }, [color, fade]);

  return (
    <>
      <LinearGradient
        colors={[layers.under, COLORS.background]}
        style={[StyleSheet.absoluteFill, { opacity }]}
      />
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: fade }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[layers.over, COLORS.background]}
          style={[StyleSheet.absoluteFill, { opacity }]}
        />
      </Animated.View>
    </>
  );
}
