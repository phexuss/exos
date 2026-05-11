import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { COLORS } from '@/constants/colors';

type SeekBarProps = {
  progress: number;
  isPlaying?: boolean;
  onSeek: (value: number) => void;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
  onScrub?: (value: number | null) => void;
  accentColor?: string;
};

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 14;
const HIT_SLOP = 16;

export function SeekBar({
  progress,
  isPlaying,
  onSeek,
  onSeekStart,
  onSeekEnd,
  onScrub,
  accentColor,
}: SeekBarProps) {
  const width = useSharedValue(0);
  const position = useSharedValue(0);
  const isScrubbing = useSharedValue(false);
  const thumbScale = useSharedValue(1);

  useEffect(() => {
    const target = progress * width.value;
    if (width.value <= 0 || isScrubbing.value) return;

    if (!isPlaying || Math.abs(position.value - target) > width.value * 0.08) {
      cancelAnimation(position);
      position.value = target;
      return;
    }

    position.value = withTiming(target, { duration: 220 });
  }, [isPlaying, isScrubbing, position, progress, width]);

  const jsScrub = useCallback(
    (ratio: number | null) => {
      onScrub?.(ratio);
    },
    [onScrub],
  );

  const pan = Gesture.Pan()
    .hitSlop({ top: HIT_SLOP, bottom: HIT_SLOP })
    .onStart((e) => {
      'worklet';
      const w = width.value;
      const x = Math.max(0, Math.min(e.x, w));
      isScrubbing.value = true;
      cancelAnimation(position);
      position.value = x;
      thumbScale.value = withTiming(1.6, { duration: 120 });
      if (onSeekStart) runOnJS(onSeekStart)();
      if (w > 0) runOnJS(jsScrub)(x / w);
    })
    .onUpdate((e) => {
      'worklet';
      const w = width.value;
      const x = Math.max(0, Math.min(e.x, w));
      position.value = x;
      if (w > 0) runOnJS(jsScrub)(x / w);
    })
    .onEnd(() => {
      'worklet';
      thumbScale.value = withTiming(1, { duration: 200 });
      const w = width.value;
      if (w > 0) runOnJS(onSeek)(position.value / w);
      runOnJS(jsScrub)(null);
      if (onSeekEnd) runOnJS(onSeekEnd)();
      isScrubbing.value = false;
    })
    .onFinalize((_e, success) => {
      'worklet';
      if (success) return;

      thumbScale.value = withTiming(1, { duration: 200 });
      isScrubbing.value = false;
      runOnJS(jsScrub)(null);
      if (onSeekEnd) runOnJS(onSeekEnd)();
    });

  const tap = Gesture.Tap()
    .hitSlop({ top: HIT_SLOP, bottom: HIT_SLOP })
    .onEnd((e) => {
      'worklet';
      const w = width.value;
      const x = Math.max(0, Math.min(e.x, w));
      cancelAnimation(position);
      position.value = x;
      if (w > 0) runOnJS(onSeek)(x / w);
    });

  const gesture = Gesture.Race(pan, tap);

  const fillStyle = useAnimatedStyle(() => {
    const w = width.value;
    const ratio = w > 0 ? Math.max(0, Math.min(1, position.value / w)) : 0;

    return {
      transform: [{ translateX: (-w * (1 - ratio)) / 2 }, { scaleX: ratio }],
    };
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: position.value - THUMB_SIZE / 2 },
      { scale: thumbScale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{
          height: THUMB_SIZE + HIT_SLOP * 2,
          justifyContent: 'center',
        }}
        onLayout={(e) => {
          width.value = e.nativeEvent.layout.width;
          if (!isScrubbing.value) {
            position.value = progress * e.nativeEvent.layout.width;
          }
        }}
      >
        <View
          style={{
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: COLORS.divider,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                right: 0,
                height: TRACK_HEIGHT,
                borderRadius: TRACK_HEIGHT / 2,
                backgroundColor: accentColor ?? COLORS.accent,
              },
              fillStyle,
            ]}
          />
        </View>
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: COLORS.textPrimary,
            },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
