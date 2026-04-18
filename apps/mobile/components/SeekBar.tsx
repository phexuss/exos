import { useCallback, useEffect, useRef } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { COLORS } from "@/constants/colors";

type SeekBarProps = {
  progress: number;
  onSeek: (value: number) => void;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
};

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 14;
const HIT_SLOP = 16;

export function SeekBar({
  progress,
  onSeek,
  onSeekStart,
  onSeekEnd,
}: SeekBarProps) {
  const width = useSharedValue(0);
  const draggingRef = useRef(false);
  const dragX = useSharedValue(0);
  const thumbScale = useSharedValue(1);

  useEffect(() => {
    if (!draggingRef.current && width.value > 0) {
      dragX.value = progress * width.value;
    }
  }, [progress]);

  const jsSeek = useCallback(
    (ratio: number) => {
      onSeek(ratio);
    },
    [onSeek],
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
      "worklet";
      const w = width.value;
      const x = Math.max(0, Math.min(e.x, w));
      dragX.value = x;
      thumbScale.value = withTiming(1.6, { duration: 120 });
      runOnJS(jsSeekStart)();
      if (w > 0) runOnJS(jsSeek)(x / w);
    })
    .onUpdate((e) => {
      "worklet";
      const w = width.value;
      const x = Math.max(0, Math.min(e.x, w));
      dragX.value = x;
      if (w > 0) runOnJS(jsSeek)(x / w);
    })
    .onEnd(() => {
      "worklet";
      thumbScale.value = withTiming(1, { duration: 200 });
      runOnJS(jsSeekEnd)();
    });

  const tap = Gesture.Tap()
    .hitSlop({ top: HIT_SLOP, bottom: HIT_SLOP })
    .onEnd((e) => {
      "worklet";
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

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{
          height: THUMB_SIZE + HIT_SLOP * 2,
          justifyContent: "center",
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
                backgroundColor: COLORS.accent,
              },
              fillStyle,
            ]}
          />
        </View>
        <Animated.View
          style={[
            {
              position: "absolute",
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
