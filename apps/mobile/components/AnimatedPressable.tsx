import type { ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GLASS_SPRING } from '@/constants/glass';
import { useGlassMode } from '@/hooks/useGlassMode';

type AnimatedPressableProps = PressableProps & {
  children: ReactNode;
  scaleValue?: number;
};

const AnimatedPressableView = Animated.createAnimatedComponent(Pressable);

export function AnimatedPressable({
  children,
  scaleValue = 0.97,
  onPressIn,
  onPressOut,
  style,
  ...props
}: AnimatedPressableProps) {
  const glassMode = useGlassMode();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressableView
      onPressIn={(e) => {
        if (glassMode) {
          // Glass surfaces should squish, not dim — dimming a blur reads as
          // a rendering glitch rather than feedback.
          scale.value = withSpring(scaleValue, GLASS_SPRING.press);
        } else {
          scale.value = withTiming(scaleValue, { duration: 120 });
          opacity.value = withTiming(0.7, { duration: 120 });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (glassMode) {
          scale.value = withSpring(1, GLASS_SPRING.snappy);
        } else {
          scale.value = withTiming(1, { duration: 200 });
          opacity.value = withTiming(1, { duration: 200 });
        }
        onPressOut?.(e);
      }}
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </AnimatedPressableView>
  );
}
