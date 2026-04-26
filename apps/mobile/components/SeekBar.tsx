import { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { COLORS } from '@/constants/colors';

type SeekBarProps = {
  progress: number;
  onSeek: (value: number) => void;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
  /**
   * Live drag value (0..1). Fired during dragging so callers can show
   * a local preview (e.g. timecode) without writing to global state.
   * Receives null when drag ends.
   */
  onScrub?: (value: number | null) => void;
  /**
   * Optional boundary marker (0..1) drawn on the track,
   * e.g. 30s preview limit against the full duration.
   */
  boundaryRatio?: number;
  boundaryColor?: string;
  accentColor?: string;
};

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 14;
const HIT_SLOP = 16;

export function SeekBar({
  progress,
  onSeek,
  onSeekStart,
  onSeekEnd,
  onScrub,
  boundaryRatio,
  boundaryColor,
  accentColor,
}: SeekBarProps) {
  const width = useSharedValue(0);
  const draggingRef = useRef(false);
  const dragX = useSharedValue(0);
  const thumbScale = useSharedValue(1);

  useEffect(() => {
    if (!draggingRef.current && width.value > 0) {
      // Smooth interpolation between coarse 250ms progress ticks
      dragX.value = withTiming(progress * width.value, {
        duration: 250,
        easing: Easing.linear,
      });
    }
  }, [progress]);

  const jsSeek = useCallback(
    (ratio: number) => {
      onSeek(ratio);
    },
    [onSeek],
  );

  const jsScrub = useCallback(
    (ratio: number | null) => {
      onScrub?.(ratio);
    },
    [onScrub],
  );

  const jsSeekStart = useCallback(() => {
    draggingRef.current = true;
    onSeekStart?.();
  }, [onSeekStart]);

  const jsSeekEnd = useCallback(() => {
    draggingRef.current = false;
    onSeekEnd?.();
  }, [onSeekEnd]);

  const pan = Gesture.Pan()
    .hitSlop({ top: HIT_SLOP, bottom: HIT_SLOP })
    .onStart((e) => {
      'worklet';
      const w = width.value;
      const x = Math.max(0, Math.min(e.x, w));
      dragX.value = x;
      thumbScale.value = withTiming(1.6, { duration: 120 });
      runOnJS(jsSeekStart)();
      if (w > 0) runOnJS(jsScrub)(x / w);
    })
    .onUpdate((e) => {
      'worklet';
      const w = width.value;
      const x = Math.max(0, Math.min(e.x, w));
      dragX.value = x;
      if (w > 0) runOnJS(jsScrub)(x / w);
    })
    .onEnd(() => {
      'worklet';
      thumbScale.value = withTiming(1, { duration: 200 });
      const w = width.value;
      if (w > 0) runOnJS(jsSeek)(dragX.value / w);
      runOnJS(jsScrub)(null);
      runOnJS(jsSeekEnd)();
    });

  const tap = Gesture.Tap()
    .hitSlop({ top: HIT_SLOP, bottom: HIT_SLOP })
    .onEnd((e) => {
      'worklet';
      const w = width.value;
      const x = Math.max(0, Math.min(e.x, w));
      dragX.value = x;
      if (w > 0) runOnJS(jsSeek)(x / w);
    });

  const gesture = Gesture.Race(pan, tap);

  const fillStyle = useAnimatedStyle(() => ({
    width: width.value > 0 ? dragX.value : 0,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value - THUMB_SIZE / 2 },
      { scale: thumbScale.value },
    ],
  }));

  const boundaryStyle = useAnimatedStyle(() => {
    const r = boundaryRatio ?? -1;
    const w = width.value;
    if (r <= 0 || r >= 1 || w <= 0) {
      return { opacity: 0, transform: [{ translateX: 0 }] };
    }
    return {
      opacity: 1,
      transform: [{ translateX: r * w - 1 }],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{
          height: THUMB_SIZE + HIT_SLOP * 2,
          justifyContent: 'center',
        }}
        onLayout={(e) => {
          width.value = e.nativeEvent.layout.width;
          if (!draggingRef.current) {
            dragX.value = progress * e.nativeEvent.layout.width;
          }
        }}
      >
        <View
          style={{
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: COLORS.divider,
          }}
        >
          <Animated.View
            style={[
              {
                height: TRACK_HEIGHT,
                borderRadius: TRACK_HEIGHT / 2,
                backgroundColor: accentColor ?? COLORS.accent,
              },
              fillStyle,
            ]}
          />
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              width: 2,
              height: TRACK_HEIGHT + 6,
              borderRadius: 1,
              backgroundColor: boundaryColor ?? 'rgba(251, 191, 36, 0.9)',
            },
            boundaryStyle,
          ]}
        />
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
