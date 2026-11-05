import { useIsFocused } from '@react-navigation/native';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

import {
  DESKTOP_SPRING,
  EASE_OUT,
  MOTION,
  prefersReducedMotion,
} from '@/constants/motion';

// The tab the user is leaving, shared by every tab's wrapper, so the one
// being entered knows which side it is coming from.
let lastIndex = 0;

type RouteInProps = {
  /** Position of this tab in the bar, left to right. */
  index: number;
  children: ReactNode;
};

/**
 * Desktop `route-in` for tab screens: on focus the screen slides 32 px in
 * from the side you travel towards and fades up. Runs inside the screen on
 * the native driver.
 *
 * Not done with the tab navigator's own scene animation on purpose: that
 * drives react-native-screens' `activityState` from an animated value, so a
 * springy transition attaches and detaches whole screens several times per
 * tap (heavy UI-thread work) and keeps `freezeOnBlur` from ever freezing
 * the hidden tabs.
 */
export function RouteIn({ index, children }: RouteInProps) {
  const focused = useIsFocused();
  const [shift] = useState(() => new Animated.Value(0));
  const [opacity] = useState(() => new Animated.Value(1));
  const first = useRef(true);

  useEffect(() => {
    if (!focused) return;
    const from = lastIndex;
    lastIndex = index;
    // The first screen just appears; later visits slide in.
    if (first.current && from === index) {
      first.current = false;
      return;
    }
    first.current = false;
    if (prefersReducedMotion()) return;
    const dir = index >= from ? 1 : -1;
    shift.setValue(dir * MOTION.routeShift);
    opacity.setValue(0);
    const run = Animated.parallel([
      Animated.spring(shift, {
        toValue: 0,
        ...DESKTOP_SPRING,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: MOTION.dur.base,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]);
    run.start();
    return () => run.stop();
  }, [focused, index, shift, opacity]);

  return (
    <Animated.View
      style={{ flex: 1, opacity, transform: [{ translateX: shift }] }}
    >
      {children}
    </Animated.View>
  );
}
