import type { ReactNode } from "react";
import { Pressable, type PressableProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

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
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressableView
      onPressIn={(e) => {
        scale.value = withTiming(scaleValue, { duration: 120 });
        opacity.value = withTiming(0.7, { duration: 120 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: 200 });
        opacity.value = withTiming(1, { duration: 200 });
        onPressOut?.(e);
      }}
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </AnimatedPressableView>
  );
}
