import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { EASE_OUT, MOTION, prefersReducedMotion } from '@/constants/motion';

type PlayRingProps = {
  playing: boolean;
  color: string;
};

/**
 * Desktop `.play-btn.playing::after`: a thin accent ring that leaves the
 * play button and fades, over and over, while music plays. Place inside the
 * button; it covers the button's box. Native driver, so the loop never
 * touches the JS thread.
 */
export function PlayRing({ playing, color }: PlayRingProps) {
  const [t] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!playing || prefersReducedMotion()) {
      t.stopAnimation();
      t.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: MOTION.ring.period,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [playing, t]);

  if (!playing) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: 999,
          borderWidth: 2,
          borderColor: color,
          opacity: t.interpolate({
            inputRange: [0, 1],
            outputRange: [MOTION.ring.from, 0],
          }),
          transform: [
            {
              scale: t.interpolate({
                inputRange: [0, 1],
                outputRange: [1, MOTION.ring.scale],
              }),
            },
          ],
        },
      ]}
    />
  );
}
