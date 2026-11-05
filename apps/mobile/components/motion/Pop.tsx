import { type ReactNode, useEffect, useState } from 'react';
import { Animated } from 'react-native';

import { DESKTOP_SPRING, prefersReducedMotion } from '@/constants/motion';

/** Where a popped glyph starts, as a share of its size. */
const FROM_SCALE = 0.6;

/**
 * Springs its child up from a smaller size when mounted. Key it by the state
 * it shows (play/pause) to pop on each change. Native driver only.
 */
export function Pop({ children }: { children: ReactNode }) {
  const [scale] = useState(
    () => new Animated.Value(prefersReducedMotion() ? 1 : FROM_SCALE),
  );

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const run = Animated.spring(scale, {
      toValue: 1,
      ...DESKTOP_SPRING,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
  );
}
