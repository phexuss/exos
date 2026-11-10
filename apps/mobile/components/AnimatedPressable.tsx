import { type ReactNode, useState } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

import { GLASS, GLASS_SPRING } from '@/constants/glass';
import { MOTION } from '@/constants/motion';
import { type HapticKind, haptic as playHaptic } from '@/utils/haptics';

type AnimatedPressableProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
  /**
   * Corner radius of a soft fill that lights up under the finger, the touch
   * equivalent of the desktop row hover. Leave out for no fill.
   */
  highlightRadius?: number;
  /** Touch response as the finger lands. Leave out for rows and cards. */
  haptic?: HapticKind;
};

const AnimatedPressableView = Animated.createAnimatedComponent(Pressable);

// Press feedback runs on React Native's native driver, not Reanimated: on the
// New Architecture Reanimated keeps the last animated props of every view it
// ever animated and re-applies all of them on each React commit until the
// view unmounts. Recycled list rows never unmount, so every tapped row made
// each later re-render (progress ticks, store updates) a bit slower.
function spring(
  value: Animated.Value,
  toValue: number,
  preset: 'press' | 'snappy',
) {
  const { damping, stiffness, mass } = GLASS_SPRING[preset];
  Animated.spring(value, {
    toValue,
    damping,
    stiffness,
    mass,
    useNativeDriver: true,
  }).start();
}

function fade(value: Animated.Value, toValue: number, duration: number) {
  Animated.timing(value, { toValue, duration, useNativeDriver: true }).start();
}

/**
 * Gives under a press and springs back, like desktop `:active`. It never
 * dims: dimming reads as a rendering glitch over glass and as "disabled"
 * everywhere else.
 */
export function AnimatedPressable({
  children,
  scaleValue = 0.97,
  highlightRadius,
  haptic,
  onPressIn,
  onPressOut,
  style,
  ...props
}: AnimatedPressableProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const [lit] = useState(() => new Animated.Value(0));
  const withHighlight = highlightRadius !== undefined;

  return (
    <AnimatedPressableView
      onPressIn={(e) => {
        spring(scale, scaleValue, 'press');
        if (withHighlight) fade(lit, 1, MOTION.dur.quick / 2);
        if (haptic) playHaptic(haptic);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        spring(scale, 1, 'snappy');
        if (withHighlight) fade(lit, 0, MOTION.dur.base);
        onPressOut?.(e);
      }}
      style={[{ transform: [{ scale }] }, style]}
      {...props}
    >
      {withHighlight ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: highlightRadius,
              backgroundColor: GLASS.innerGlow,
              opacity: lit,
            },
          ]}
        />
      ) : null}
      {children}
    </AnimatedPressableView>
  );
}
