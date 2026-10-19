import { useCallback, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { COLORS } from '@/constants/colors';
import { GLASS_SPRING } from '@/constants/glass';

type SeekBarProps = {
  progress: number;
  isPlaying?: boolean;
  onSeek: (value: number) => void;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
  onScrub?: (value: number | null) => void;
  accentColor?: string;
  /**
   * iOS 26-style scrubber: no thumb, a translucent track that swells while
   * it's being dragged.
   */
  glass?: boolean;
};

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 14;
const HIT_SLOP = 16;
const GLASS_TRACK_HEIGHT = 6;
const GLASS_TRACK_ACTIVE_HEIGHT = 14;

export function SeekBar({
  progress,
  isPlaying,
  onSeek,
  onSeekStart,
  onSeekEnd,
  onScrub,
  accentColor,
  glass = false,
}: SeekBarProps) {
  const restHeight = glass ? GLASS_TRACK_HEIGHT : TRACK_HEIGHT;
  const width = useSharedValue(0);
  const position = useSharedValue(0);
  const isScrubbing = useSharedValue(false);
  const thumbScale = useSharedValue(1);
  const trackHeight = useSharedValue(restHeight);

  // JS-side copies of what the progress effect needs. Reading a shared
  // value's `.value` from React blocks the JS thread until the UI thread
  // answers, and this effect runs on every 250 ms progress tick.
  const layoutWidth = useRef(0);
  const scrubbing = useRef(false);
  const lastTarget = useRef(0);

  useEffect(() => {
    trackHeight.set(restHeight);
  }, [restHeight, trackHeight]);

  useEffect(() => {
    const w = layoutWidth.current;
    if (w <= 0 || scrubbing.current) return;
    const target = progress * w;
    const jump = Math.abs(lastTarget.current - target) > w * 0.08;
    lastTarget.current = target;

    if (!isPlaying || jump) {
      cancelAnimation(position);
      position.set(target);
      return;
    }

    position.set(withTiming(target, { duration: 220 }));
  }, [isPlaying, position, progress]);

  const jsScrub = useCallback(
    (ratio: number | null) => {
      scrubbing.current = ratio !== null;
      onScrub?.(ratio);
    },
    [onScrub],
  );

  // Built once per set of callbacks: progress re-renders this every 250 ms and
  // a fresh gesture object makes the detector reconfigure natively each time.
  const gesture = useMemo(() => {
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
        if (glass) {
          trackHeight.value = withSpring(
            GLASS_TRACK_ACTIVE_HEIGHT,
            GLASS_SPRING.snappy,
          );
        }
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
        trackHeight.value = withSpring(restHeight, GLASS_SPRING.smooth);
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
        trackHeight.value = withSpring(restHeight, GLASS_SPRING.smooth);
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

    return Gesture.Race(pan, tap);
  }, [
    glass,
    restHeight,
    onSeek,
    onSeekStart,
    onSeekEnd,
    jsScrub,
    width,
    position,
    isScrubbing,
    thumbScale,
    trackHeight,
  ]);

  const fillStyle = useAnimatedStyle(() => {
    const w = width.value;
    const ratio = w > 0 ? Math.max(0, Math.min(1, position.value / w)) : 0;

    return {
      transform: [{ translateX: (-w * (1 - ratio)) / 2 }, { scaleX: ratio }],
    };
  });

  const trackStyle = useAnimatedStyle(() => ({
    height: trackHeight.value,
    borderRadius: trackHeight.value / 2,
  }));

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
          const w = e.nativeEvent.layout.width;
          layoutWidth.current = w;
          width.set(w);
          if (!scrubbing.current) {
            lastTarget.current = progress * w;
            position.set(lastTarget.current);
          }
        }}
      >
        <Animated.View
          style={[
            {
              backgroundColor: glass
                ? 'rgba(255,255,255,0.22)'
                : COLORS.divider,
              overflow: 'hidden',
            },
            trackStyle,
          ]}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: glass
                  ? COLORS.textPrimary
                  : (accentColor ?? COLORS.accent),
              },
              fillStyle,
            ]}
          />
        </Animated.View>
        {glass ? null : (
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
        )}
      </View>
    </GestureDetector>
  );
}
