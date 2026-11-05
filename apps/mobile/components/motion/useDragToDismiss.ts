import { useMemo, useState } from 'react';
import { Animated, useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';

import { DESKTOP_SPRING, EASE_OUT, MOTION } from '@/constants/motion';

/** Share of the screen height a drag must cover to close on release. */
const CLOSE_DISTANCE = 0.22;
/** A flick this fast (px/s) closes from any distance. */
const CLOSE_VELOCITY = 900;
/** Movement before the drag takes over from taps and horizontal swipes. */
const ACTIVATE = 14;
/** How small the layer gets by the time it reaches the bottom. */
const LEAVE_SCALE = 0.94;

/**
 * A full-screen layer that follows the finger down and closes past a
 * distance or on a flick, otherwise springs back, shrinking a little as it
 * goes so it reads as a card being put away.
 *
 * React Native `Animated`, not Reanimated, for the same reason as
 * `useSwipeToSkip`: no shadow-tree commit per frame on Android.
 */
export function useDragToDismiss(onDismiss: () => void) {
  const { height } = useWindowDimensions();
  const [drag] = useState(() => new Animated.Value(0));

  // Two recognisers over one value: one for the whole layer, one for a
  // handle (the header) that keeps working while the body scrolls.
  const [gesture, handleGesture] = useMemo(() => {
    const make = () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetY(ACTIVATE)
        .failOffsetX([-ACTIVATE, ACTIVATE])
        .onUpdate((e) => {
          drag.setValue(Math.max(e.translationY, 0));
        })
        .onFinalize((_e, success) => {
          // Cancelled (system back, a call, another gesture won): onEnd
          // never runs, so put the view back here.
          if (!success) {
            Animated.spring(drag, {
              toValue: 0,
              ...DESKTOP_SPRING,
              useNativeDriver: true,
            }).start();
          }
        })
        .onEnd((e) => {
          const close =
            e.translationY > height * CLOSE_DISTANCE ||
            (e.velocityY > CLOSE_VELOCITY && e.translationY > 0);
          if (close) {
            Animated.timing(drag, {
              toValue: height,
              duration: MOTION.dur.quick + 60,
              easing: EASE_OUT,
              useNativeDriver: true,
            }).start(({ finished }) => {
              if (finished) onDismiss();
            });
          } else {
            Animated.spring(drag, {
              toValue: 0,
              ...DESKTOP_SPRING,
              velocity: e.velocityY,
              useNativeDriver: true,
            }).start();
          }
        });
    return [make(), make()] as const;
  }, [drag, height, onDismiss]);

  const style = useMemo(
    () => ({
      transform: [
        { translateY: drag },
        {
          scale: drag.interpolate({
            inputRange: [0, Math.max(height, 1)],
            outputRange: [1, LEAVE_SCALE],
            extrapolate: 'clamp' as const,
          }),
        },
      ],
    }),
    [drag, height],
  );

  return { gesture, handleGesture, style };
}
