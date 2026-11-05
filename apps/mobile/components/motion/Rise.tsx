import { type ReactNode, useEffect, useState } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

import {
  DESKTOP_SPRING,
  EASE_OUT,
  MOTION,
  prefersReducedMotion,
  staggerDelay,
} from '@/constants/motion';

type RiseProps = {
  children: ReactNode;
  /** Position among its siblings; sets the cascade delay. */
  index?: number;
  /** Extra steps of delay, for lists that start once their section has arrived. */
  after?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * False shows the child at rest. List rows pass `index <= staggerCap`, so
   * the first screenful cascades and cells created later, mid-scroll, don't
   * fade in behind the finger.
   */
  animate?: boolean;
};

/**
 * Desktop `rise`: the child arrives from a little below, a touch smaller, and
 * settles with the desktop spring, one sibling after another. Runs once, when
 * mounted. Native-driver opacity and transform only, so a list of these costs
 * the JS thread nothing per frame and leaves no animated props behind on
 * recycled rows (see AnimatedPressable).
 */
export function Rise({
  children,
  index = 0,
  after = 0,
  style,
  animate = true,
}: RiseProps) {
  // Decided once, at mount: a recycled cell keeps whatever it started with.
  const [still] = useState(() => !animate || prefersReducedMotion());
  const [opacity] = useState(() => new Animated.Value(still ? 1 : 0));
  const [progress] = useState(() => new Animated.Value(still ? 1 : 0));

  useEffect(() => {
    if (still) return;
    const delay = staggerDelay(index) + after * MOTION.stagger;
    // Opacity eases out, the movement springs: an overshooting opacity would
    // clip at 1 and read as a flash.
    const run = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: MOTION.dur.base,
        delay,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(progress, {
          toValue: 1,
          ...DESKTOP_SPRING,
          useNativeDriver: true,
        }),
      ]),
    ]);
    run.start();
    return () => run.stop();
  }, [still, opacity, progress, index, after]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [MOTION.rise.offsetY, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [MOTION.rise.scale, 1],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
