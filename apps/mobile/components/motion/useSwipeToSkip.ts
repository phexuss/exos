import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Animated } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';

import { DESKTOP_SPRING, EASE_OUT, MOTION } from '@/constants/motion';

/** Share of the surface width a swipe must cover to change track. */
const SKIP_DISTANCE = 0.3;
/** A flick this fast (px/s) changes track from any distance. */
const SKIP_VELOCITY = 800;
/** Movement before the swipe takes over from taps and vertical drags. */
const ACTIVATE = 14;
/** The next track arrives from this share of the width on the other side. */
const ENTER_FROM = 0.35;

/**
 * Swipe a surface sideways to change track: it follows the finger, flies
 * off past a distance or on a flick while the next track comes in from the
 * other side, and springs back otherwise. Left is next, right is previous.
 *
 * Runs on React Native `Animated`, not Reanimated: on Android every
 * Reanimated frame here re-commits the whole shadow tree, and every view it
 * ever animated slows each later React commit (see mobile perf notes). The
 * finger is followed from the JS thread; the fly-off and settle run on the
 * native driver.
 */
export function useSwipeToSkip(
  width: number,
  onNext: () => void,
  onPrevious: () => void,
) {
  const [shift] = useState(() => new Animated.Value(0));

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-ACTIVATE, ACTIVATE])
        .failOffsetY([-ACTIVATE, ACTIVATE])
        .onUpdate((e) => {
          shift.setValue(e.translationX);
        })
        .onEnd((e) => {
          const far = Math.abs(e.translationX) > width * SKIP_DISTANCE;
          const fast =
            Math.abs(e.velocityX) > SKIP_VELOCITY &&
            Math.sign(e.velocityX) === Math.sign(e.translationX);
          if (!width || !(far || fast)) {
            Animated.spring(shift, {
              toValue: 0,
              ...DESKTOP_SPRING,
              useNativeDriver: true,
            }).start();
            return;
          }
          const dir = e.translationX < 0 ? -1 : 1;
          Haptics.selectionAsync().catch(() => {});
          Animated.timing(shift, {
            toValue: dir * width,
            duration: MOTION.dur.quick,
            easing: EASE_OUT,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (!finished) return;
            (dir < 0 ? onNext : onPrevious)();
            shift.setValue(-dir * width * ENTER_FROM);
            Animated.spring(shift, {
              toValue: 0,
              ...DESKTOP_SPRING,
              useNativeDriver: true,
            }).start();
          });
        }),
    [shift, width, onNext, onPrevious],
  );

  // Built once per width: a fresh interpolation each render would rewire the
  // native animation graph on every progress tick.
  const style = useMemo(() => {
    const w = Math.max(width, 1);
    return {
      opacity: shift.interpolate({
        inputRange: [-w, 0, w],
        outputRange: [0, 1, 0],
        extrapolate: 'clamp' as const,
      }),
      transform: [
        { translateX: shift },
        {
          scale: shift.interpolate({
            inputRange: [-w, 0, w],
            outputRange: [MOTION.pausedArtScale, 1, MOTION.pausedArtScale],
            extrapolate: 'clamp' as const,
          }),
        },
      ],
    };
  }, [shift, width]);

  return { gesture, style };
}
