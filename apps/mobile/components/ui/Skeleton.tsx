import { useEffect, useState } from 'react';
import { Animated, type ViewStyle } from 'react-native';

import { COLORS } from '@/constants/colors';

type SkeletonProps = {
  width: number | `${number}%`;
  height: number | `${number}%`;
  radius?: number;
  circle?: boolean;
  style?: ViewStyle;
};

export function Skeleton({
  width,
  height,
  radius = 12,
  circle,
  style,
}: SkeletonProps) {
  // Native-driver loop: skeletons can sit on a kept-alive tab for as long
  // as a request hangs, and a Reanimated loop there cost a shadow-tree
  // commit per frame on Android.
  const [opacity] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const animatedStyle = { opacity };

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
