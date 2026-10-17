import {
  Easing,
  SlideInDown,
  SlideInRight,
  SlideOutDown,
  SlideOutRight,
} from 'react-native-reanimated';

import { GLASS_SPRING } from '@/constants/glass';

const EXIT_EASING = Easing.out(Easing.cubic);

function spring<
  T extends {
    damping: (v: number) => T;
    stiffness: (v: number) => T;
    mass: (v: number) => T;
  },
>(layout: T): T {
  return layout
    .damping(GLASS_SPRING.smooth.damping)
    .stiffness(GLASS_SPRING.smooth.stiffness)
    .mass(GLASS_SPRING.smooth.mass);
}

/** Full-screen overlay pushed from the right. */
export function glassPushEntering() {
  return spring(SlideInRight.springify());
}

/** Full-screen overlay presented from the bottom. */
export function glassPresentEntering() {
  return spring(SlideInDown.springify());
}

/** Dismiss to the right: fast start, short tail — iOS-like, not sluggish. */
export function glassPushExiting() {
  return SlideOutRight.duration(200).easing(EXIT_EASING);
}

/** Dismiss downward. */
export function glassPresentExiting() {
  return SlideOutDown.duration(220).easing(EXIT_EASING);
}
