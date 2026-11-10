import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

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
/** How often the player reports its position. */
const POLL_MS = 250;
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
  // The track is laid out at its tallest and squashed to rest with scaleY,
  // so the swell runs on the native driver (height can't).
  const tallHeight = glass ? GLASS_TRACK_ACTIVE_HEIGHT : TRACK_HEIGHT;
  const restScale = glass ? GLASS_TRACK_HEIGHT / GLASS_TRACK_ACTIVE_HEIGHT : 1;

  // React Native Animated, not Reanimated: the bar animates on every 250 ms
  // progress tick for as long as the player is open, and on Android every
  // Reanimated frame re-commits the shadow tree.
  const [width, setWidth] = useState(0);
  const [position] = useState(() => new Animated.Value(0));
  const [thumbScale] = useState(() => new Animated.Value(1));
  const [trackScale] = useState(() => new Animated.Value(restScale));

  const layoutWidth = useRef(0);
  const scrubbing = useRef(false);
  const lastTarget = useRef(0);
  const lastX = useRef(0);

  useEffect(() => {
    trackScale.setValue(restScale);
  }, [restScale, trackScale]);

  useEffect(() => {
    const w = layoutWidth.current;
    if (w <= 0 || scrubbing.current) return;
    const target = progress * w;
    const jump = Math.abs(lastTarget.current - target) > w * 0.08;
    lastTarget.current = target;

    if (!isPlaying || jump) {
      position.setValue(target);
      return;
    }

    // As long as a poll interval, so one glide hands over to the next
    // without the bar resting in between.
    Animated.timing(position, {
      toValue: target,
      duration: POLL_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [isPlaying, position, progress]);

  const scrub = useCallback(
    (ratio: number | null) => {
      scrubbing.current = ratio !== null;
      onScrub?.(ratio);
    },
    [onScrub],
  );

  const settle = useCallback(() => {
    Animated.timing(thumbScale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    Animated.spring(trackScale, {
      toValue: restScale,
      ...GLASS_SPRING.smooth,
      useNativeDriver: true,
    }).start();
  }, [thumbScale, trackScale, restScale]);

  // Built once per set of callbacks: progress re-renders this every 250 ms and
  // a fresh gesture object makes the detector reconfigure natively each time.
  const gesture = useMemo(() => {
    const clampX = (x: number) => Math.max(0, Math.min(x, layoutWidth.current));

    const pan = Gesture.Pan()
      .runOnJS(true)
      .hitSlop({ top: HIT_SLOP, bottom: HIT_SLOP })
      .onStart((e) => {
        const w = layoutWidth.current;
        const x = clampX(e.x);
        lastX.current = x;
        position.stopAnimation();
        position.setValue(x);
        Animated.timing(thumbScale, {
          toValue: 1.6,
          duration: 120,
          useNativeDriver: true,
        }).start();
        if (glass) {
          Animated.spring(trackScale, {
            toValue: 1,
            ...GLASS_SPRING.snappy,
            useNativeDriver: true,
          }).start();
        }
        onSeekStart?.();
        if (w > 0) scrub(x / w);
      })
      .onUpdate((e) => {
        const w = layoutWidth.current;
        const x = clampX(e.x);
        lastX.current = x;
        position.setValue(x);
        if (w > 0) scrub(x / w);
      })
      .onEnd(() => {
        settle();
        const w = layoutWidth.current;
        if (w > 0) onSeek(lastX.current / w);
        scrub(null);
        onSeekEnd?.();
      })
      .onFinalize((_e, success) => {
        if (success) return;
        settle();
        scrub(null);
        onSeekEnd?.();
      });

    const tap = Gesture.Tap()
      .runOnJS(true)
      .hitSlop({ top: HIT_SLOP, bottom: HIT_SLOP })
      .onEnd((e) => {
        const w = layoutWidth.current;
        const x = clampX(e.x);
        position.stopAnimation();
        position.setValue(x);
        lastTarget.current = x;
        if (w > 0) onSeek(x / w);
      });

    return Gesture.Race(pan, tap);
  }, [
    glass,
    onSeek,
    onSeekStart,
    onSeekEnd,
    scrub,
    settle,
    position,
    thumbScale,
    trackScale,
  ]);

  // Built once per width: fresh interpolations each render would rewire the
  // native animation graph on every progress tick.
  const styles = useMemo(() => {
    const w = Math.max(width, 1);
    return {
      fill: {
        transform: [
          {
            translateX: position.interpolate({
              inputRange: [0, w],
              outputRange: [-w / 2, 0],
              extrapolate: 'clamp' as const,
            }),
          },
          {
            scaleX: position.interpolate({
              inputRange: [0, w],
              outputRange: [0, 1],
              extrapolate: 'clamp' as const,
            }),
          },
        ],
      },
      thumb: {
        transform: [
          { translateX: Animated.add(position, -THUMB_SIZE / 2) },
          { scale: thumbScale },
        ],
      },
    };
  }, [width, position, thumbScale]);

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
          setWidth(w);
          if (!scrubbing.current) {
            lastTarget.current = progress * w;
            position.setValue(lastTarget.current);
          }
        }}
      >
        <Animated.View
          style={{
            height: tallHeight,
            borderRadius: tallHeight / 2,
            backgroundColor: glass ? 'rgba(255,255,255,0.22)' : COLORS.divider,
            overflow: 'hidden',
            transform: [{ scaleY: trackScale }],
          }}
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
              styles.fill,
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
              styles.thumb,
            ]}
          />
        )}
      </View>
    </GestureDetector>
  );
}
