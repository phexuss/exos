import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

type EqBarsProps = {
  color: string;
  playing: boolean;
  size?: number;
};

const BARS = [0.55, 1, 0.75];
const PERIODS = [520, 640, 460];

/**
 * Three bars that bounce while the track plays and rest when paused, like
 * the playing-track marker in the desktop track table. Native-driver
 * transforms only, so it costs the JS thread nothing.
 */
export function EqBars({ color, playing, size = 14 }: EqBarsProps) {
  const values = useRef(BARS.map((h) => new Animated.Value(h))).current;

  useEffect(() => {
    if (!playing) {
      for (const [i, v] of values.entries()) {
        v.stopAnimation();
        Animated.timing(v, {
          toValue: BARS[i] * 0.5,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
      return;
    }
    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: PERIODS[i] / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0.25,
            duration: PERIODS[i] / 2,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    for (const loop of loops) loop.start();
    return () => {
      for (const loop of loops) loop.stop();
    };
  }, [playing, values]);

  const barWidth = Math.max(2, Math.round(size / 5));
  return (
    <View
      style={{
        width: size,
        height: size,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}
    >
      {values.map((v, i) => (
        <Animated.View
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed set of bars
          key={i}
          style={{
            width: barWidth,
            height: size,
            borderRadius: barWidth / 2,
            backgroundColor: color,
            transformOrigin: 'bottom',
            transform: [{ scaleY: v }],
          }}
        />
      ))}
    </View>
  );
}
