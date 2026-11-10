import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';

import {
  dragPlayerSheet,
  grabPlayerSheet,
  settlePlayerSheet,
} from '@/components/motion/playerMotion';
import { haptic } from '@/utils/haptics';

/** Share of the screen height a drag must cover to close on release. */
const CLOSE_DISTANCE = 0.22;
/** A flick this fast (px/s) closes from any distance. */
const CLOSE_VELOCITY = 900;
/** Movement before the drag takes over from taps and horizontal swipes. */
const ACTIVATE = 14;

/**
 * Pull the open player down: it follows the finger and closes past a
 * distance or on a flick, otherwise springs back up, keeping the speed it
 * was let go with.
 *
 * The finger is followed from the JS thread through React Native `Animated`
 * (see `playerMotion`), not Reanimated: no shadow-tree commit per frame on
 * Android. The settle runs on the native driver.
 */
export function useDragToDismiss() {
  const { height } = useWindowDimensions();

  // Two recognisers over one value: one for the whole layer, one for a
  // handle (the header) that keeps working while the body scrolls.
  const [gesture, handleGesture] = useMemo(() => {
    const h = Math.max(height, 1);
    const make = () => {
      // Only a drag that actually took the sheet may settle it: a plain tap
      // on a button also begins and fails this recogniser. An object, not a
      // `let`: gesture callbacks are compiled as worklets, which capture
      // plain variables by value.
      const held = { current: false };
      return (
        Gesture.Pan()
          .runOnJS(true)
          .activeOffsetY(ACTIVATE)
          .failOffsetX([-ACTIVATE, ACTIVATE])
          .onStart(() => {
            held.current = true;
            grabPlayerSheet();
          })
          .onUpdate((e) => {
            dragPlayerSheet(1 - Math.max(e.translationY, 0) / h);
          })
          // The one callback that runs however the drag stops: a release, or
          // a cancel (system back, a call) that must put the sheet back.
          .onFinalize((e, success) => {
            if (!held.current) return;
            held.current = false;
            const close =
              success &&
              (e.translationY > h * CLOSE_DISTANCE ||
                (e.velocityY > CLOSE_VELOCITY && e.translationY > 0));
            if (close) haptic('tick');
            settlePlayerSheet(!close, success ? -e.velocityY / h : 0);
          })
      );
    };
    return [make(), make()] as const;
  }, [height]);

  return { gesture, handleGesture };
}
