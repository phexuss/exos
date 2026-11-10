import { Animated } from 'react-native';
import { create } from 'zustand';

import {
  EASE_OUT,
  MOTION,
  prefersReducedMotion,
  SHEET_SPRING,
} from '@/constants/motion';
import { usePlayerStore } from '@/store/usePlayerStore';

/**
 * How far the full-screen player is presented: 0 is put away under the
 * bottom edge, 1 covers the screen. One value for everything that moves it —
 * the tap on the mini player, the pull up from it, the drag down to close —
 * so the sheet is always exactly where the finger or the last spring left
 * it, and a gesture can pick it up mid-flight.
 */
export const playerOpen = new Animated.Value(0);

type PresentedState = { presented: boolean };

/**
 * True while any part of the player is on screen (open, opening, closing or
 * under a finger). The sheet stays mounted when it is not, but frozen, with
 * its loops stopped.
 */
export const usePlayerPresented = create<PresentedState>(() => ({
  presented: false,
}));

let target = false;
let running: Animated.CompositeAnimation | null = null;

function animateTo(open: boolean, velocity: number): void {
  running?.stop();
  if (open) usePlayerPresented.setState({ presented: true });
  const run = prefersReducedMotion()
    ? Animated.timing(playerOpen, {
        toValue: open ? 1 : 0,
        duration: MOTION.dur.quick,
        easing: EASE_OUT,
        useNativeDriver: true,
      })
    : Animated.spring(playerOpen, {
        toValue: open ? 1 : 0,
        velocity,
        ...SHEET_SPRING,
        useNativeDriver: true,
      });
  running = run;
  run.start(({ finished }) => {
    if (running === run) running = null;
    if (finished && !open && !target) {
      usePlayerPresented.setState({ presented: false });
    }
  });
}

/**
 * Follows the store: opening or closing from a tap, the back button or
 * code. A gesture that already settled the sheet the same way is left alone.
 */
export function syncPlayerSheet(open: boolean): void {
  if (target === open) return;
  target = open;
  animateTo(open, 0);
}

/** A finger took the sheet: stop whatever was moving it. */
export function grabPlayerSheet(): void {
  running?.stop();
  running = null;
  usePlayerPresented.setState({ presented: true });
}

/** The sheet under a finger, `value` from 0 (away) to 1 (open). */
export function dragPlayerSheet(value: number): void {
  playerOpen.setValue(Math.max(0, Math.min(1, value)));
}

/**
 * The finger let go: finish opening or closing from where it is, at the
 * speed it was moving (`velocity` in sheet heights per second, positive
 * towards open), and tell the store.
 */
export function settlePlayerSheet(open: boolean, velocity: number): void {
  target = open;
  animateTo(open, velocity);
  const player = usePlayerStore.getState();
  if (open !== player.isPlayerOpen) {
    if (open) player.openPlayer();
    else player.closePlayer();
  }
}
