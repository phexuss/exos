import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DESKTOP_SPRING, EASE_OUT, MOTION } from '@/constants/motion';

/** Share of the surface width a swipe must cover to change track. */
const SKIP_DISTANCE = 0.3;
/** A flick this fast (px/s) changes track from any distance. */
const SKIP_VELOCITY = 800;
/** Movement before the swipe takes over from taps and vertical drags. */
const ACTIVATE = 14;
/** The next track arrives from this share of the width on the other side. */
const ENTER_FROM = 0.35;

const tick = () => {
  Haptics.selectionAsync().catch(() => {});
};

/**
 * Swipe a surface sideways to change track: it follows the finger, flies
 * off past a distance or on a flick while the next track comes in from the
 * other side, and springs back otherwise. Left is next, right is previous.
 */
export function useSwipeToSkip(
  width: number,
  onNext: () => void,
  onPrevious: () => void,
) {
  const shift = useSharedValue(0);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-ACTIVATE, ACTIVATE])
        .failOffsetY([-ACTIVATE, ACTIVATE])
        .onUpdate((e) => {
          'worklet';
          shift.set(e.translationX);
        })
        .onEnd((e) => {
          'worklet';
          const far = Math.abs(e.translationX) > width * SKIP_DISTANCE;
          const fast =
            Math.abs(e.velocityX) > SKIP_VELOCITY &&
            Math.sign(e.velocityX) === Math.sign(e.translationX);
          if (!width || !(far || fast)) {
            shift.set(withSpring(0, DESKTOP_SPRING));
            return;
          }
          const dir = e.translationX < 0 ? -1 : 1;
          runOnJS(tick)();
          shift.set(
            withTiming(
              dir * width,
              { duration: MOTION.dur.quick, easing: EASE_OUT },
              (done) => {
                if (!done) return;
                runOnJS(dir < 0 ? onNext : onPrevious)();
                shift.set(-dir * width * ENTER_FROM);
                shift.set(withSpring(0, DESKTOP_SPRING));
              },
            ),
          );
        }),
    [shift, width, onNext, onPrevious],
  );

  const style = useAnimatedStyle(() => {
    const away = Math.abs(shift.get());
    return {
      opacity: interpolate(
        away,
        [0, Math.max(width, 1)],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        { translateX: shift.get() },
        {
          scale: interpolate(
            away,
            [0, Math.max(width, 1)],
            [1, MOTION.pausedArtScale],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return { gesture, style };
}
