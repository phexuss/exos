import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
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

import { GLASS } from '@/constants/glass';
import { DESKTOP_SPRING, EASE_OUT, MOTION } from '@/constants/motion';

/** Share of the screen height a drag must cover to close on release. */
const CLOSE_DISTANCE = 0.22;
/** A flick this fast (px/s) closes from any distance. */
const CLOSE_VELOCITY = 900;
/** Movement before the drag takes over from taps and horizontal swipes. */
const ACTIVATE = 14;
/** Upward pull is resisted this much. */
const RUBBER = 0.12;

/**
 * A full-screen layer that follows the finger down and closes past a
 * distance or on a flick, otherwise springs back. The layer rounds its
 * corners and gives a little as it leaves, so it reads as a card being put
 * away rather than a page sliding.
 */
export function useDragToDismiss(onDismiss: () => void) {
  const { height } = useWindowDimensions();
  const drag = useSharedValue(0);

  // Two recognisers over one value: one for the whole layer, one for a
  // handle (the header) that keeps working while the body scrolls.
  const [gesture, handleGesture] = useMemo(() => {
    const make = () =>
      Gesture.Pan()
        .activeOffsetY(ACTIVATE)
        .failOffsetX([-ACTIVATE, ACTIVATE])
        .onUpdate((e) => {
          'worklet';
          drag.set(
            e.translationY > 0 ? e.translationY : e.translationY * RUBBER,
          );
        })
        .onEnd((e) => {
          'worklet';
          const close =
            e.translationY > height * CLOSE_DISTANCE ||
            (e.velocityY > CLOSE_VELOCITY && e.translationY > 0);
          if (close) {
            drag.set(
              withTiming(
                height,
                { duration: MOTION.dur.quick + 60, easing: EASE_OUT },
                (done) => {
                  if (done) runOnJS(onDismiss)();
                },
              ),
            );
          } else {
            drag.set(
              withSpring(0, { ...DESKTOP_SPRING, velocity: e.velocityY }),
            );
          }
        });
    return [make(), make()] as const;
  }, [drag, height, onDismiss]);

  const style = useAnimatedStyle(() => {
    const d = Math.max(drag.get(), 0);
    return {
      borderRadius: interpolate(
        d,
        [0, ACTIVATE * 4],
        [0, GLASS.radius.sheet],
        Extrapolation.CLAMP,
      ),
      transform: [
        { translateY: drag.get() },
        {
          scale: interpolate(d, [0, height], [1, 0.94], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return { gesture, handleGesture, style };
}
