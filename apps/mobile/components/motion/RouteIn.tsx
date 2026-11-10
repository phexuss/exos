import { useIsFocused } from '@react-navigation/native';
import { type ReactNode, useEffect, useState } from 'react';
import { Animated } from 'react-native';

import { EASE_OUT, MOTION, prefersReducedMotion } from '@/constants/motion';

// The tab the user is leaving, shared by every tab's wrapper.
let lastIndex = 0;

type RouteInProps = {
  /** Position of this tab in the bar, left to right. */
  index: number;
  children: ReactNode;
};

/** Where a tab starts its fade from: enough to read as a change, no flash. */
const FROM_OPACITY = 0.4;

/**
 * Tab screens change in place with a short fade, the way the tabs of a
 * phone's own apps do. No sideways slide: the bar under the thumb does not
 * move, so a page that shifts 32 px on every tap reads as a twitch.
 *
 * Not done with the tab navigator's own scene animation on purpose: that
 * drives react-native-screens' `activityState` from an animated value, which
 * re-attaches whole screens mid-transition (heavy UI-thread work) and keeps
 * `freezeOnBlur` from ever freezing the hidden tabs.
 */
export function RouteIn({ index, children }: RouteInProps) {
  const focused = useIsFocused();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!focused) return;
    const from = lastIndex;
    lastIndex = index;
    // Coming back to the same tab (from a pushed route) is not a change.
    if (from === index || prefersReducedMotion()) return;
    opacity.setValue(FROM_OPACITY);
    const run = Animated.timing(opacity, {
      toValue: 1,
      duration: MOTION.dur.quick,
      easing: EASE_OUT,
      useNativeDriver: true,
    });
    run.start();
    return () => {
      run.stop();
      opacity.setValue(1);
    };
  }, [focused, index, opacity]);

  return <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>;
}
