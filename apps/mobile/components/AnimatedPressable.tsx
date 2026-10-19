import { type ReactNode, useState } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { GLASS_SPRING } from '@/constants/glass';
import { useGlassMode } from '@/hooks/useGlassMode';

type AnimatedPressableProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
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

function timing(value: Animated.Value, toValue: number, duration: number) {
  Animated.timing(value, { toValue, duration, useNativeDriver: true }).start();
}

export function AnimatedPressable({
  children,
  scaleValue = 0.97,
  onPressIn,
  onPressOut,
  style,
  ...props
}: AnimatedPressableProps) {
  const glassMode = useGlassMode();
  const [scale] = useState(() => new Animated.Value(1));
  const [opacity] = useState(() => new Animated.Value(1));

  return (
    <AnimatedPressableView
      onPressIn={(e) => {
        if (glassMode) {
          // Glass surfaces should squish, not dim — dimming a blur reads as
          // a rendering glitch rather than feedback.
          spring(scale, scaleValue, 'press');
        } else {
          timing(scale, scaleValue, 120);
          timing(opacity, 0.7, 120);
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (glassMode) {
          spring(scale, 1, 'snappy');
        } else {
          timing(scale, 1, 200);
          timing(opacity, 1, 200);
        }
        onPressOut?.(e);
      }}
      style={[{ transform: [{ scale }], opacity }, style]}
      {...props}
    >
      {children}
    </AnimatedPressableView>
  );
}
