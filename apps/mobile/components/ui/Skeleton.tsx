import { useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { COLORS } from '@/constants/colors';

type SkeletonProps = {
  width: number | `${number}%`;
  height: number | `${number}%`;
  radius?: number;
  circle?: boolean;
  style?: ViewStyle;
};

export function Skeleton({ width, height, radius = 12, circle, style }: SkeletonProps) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.35, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const resolvedRadius = circle
    ? typeof width === 'number'
      ? width / 2
      : 9999
    : radius;

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: resolvedRadius,
          backgroundColor: COLORS.surfaceMuted,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
