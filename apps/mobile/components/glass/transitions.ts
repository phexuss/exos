import { SlideInDown, SlideInRight } from 'react-native-reanimated';

import { GLASS_SPRING } from '@/constants/glass';

/** Full-screen overlay pushed from the right, settling on a soft spring. */
export function glassPushEntering() {
  return SlideInRight.springify()
    .damping(GLASS_SPRING.smooth.damping)
    .stiffness(GLASS_SPRING.smooth.stiffness);
}

/** Full-screen overlay presented from the bottom, settling on a soft spring. */
export function glassPresentEntering() {
  return SlideInDown.springify()
    .damping(GLASS_SPRING.smooth.damping)
    .stiffness(GLASS_SPRING.smooth.stiffness);
}
