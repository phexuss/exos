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

  // .get()/.set() instead of .value: the React Compiler (enabled in app.json)
  // can't see through property writes on hook results and skips the component.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
    opacity: opacity.get(),
  }));

  return (
    <AnimatedPressableView
      onPressIn={(e) => {
        if (glassMode) {
          // Glass surfaces should squish, not dim — dimming a blur reads as
          // a rendering glitch rather than feedback.
          scale.set(withSpring(scaleValue, GLASS_SPRING.press));
        } else {
          scale.set(withTiming(scaleValue, { duration: 120 }));
          opacity.set(withTiming(0.7, { duration: 120 }));
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (glassMode) {
          scale.set(withSpring(1, GLASS_SPRING.snappy));
        } else {
          scale.set(withTiming(1, { duration: 200 }));
          opacity.set(withTiming(1, { duration: 200 }));
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
