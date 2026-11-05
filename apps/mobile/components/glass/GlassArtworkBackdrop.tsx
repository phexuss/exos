import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AccentGlow } from '@/components/motion/AccentGlow';
import { COLORS } from '@/constants/colors';
import { MOTION, prefersReducedMotion } from '@/constants/motion';
import { useSettingsStore } from '@/store/useSettingsStore';

type GlassArtworkBackdropProps = {
  coverUrl?: string;
  accentColor: string;
};

const DRIFT_MS = 18000;

// On Android every frame of the drift makes each native blur on screen
// re-capture and re-blur its whole source view, so there the backdrop
// drifts only while live blur is off (the default): then nothing on screen
// re-blurs, and moving one pre-blurred bitmap is a cheap transform.
function useDriftEnabled(): boolean {
  const liveBlur = useSettingsStore((s) => s.glassBlur);
  return Platform.OS !== 'android' || !liveBlur;
}

/**
 * Full-bleed, heavily blurred album art that slowly drifts and breathes —
 * the living backdrop the player's glass sits on. Static on Android.
 */
export function GlassArtworkBackdrop({
  coverUrl,
  accentColor,
}: GlassArtworkBackdropProps) {
  const drift = useSharedValue(0);
  const driftEnabled = useDriftEnabled();

  useEffect(() => {
    if (!driftEnabled || prefersReducedMotion()) {
      cancelAnimation(drift);
      drift.set(0);
      return;
    }
    drift.value = withRepeat(
      withTiming(1, { duration: DRIFT_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(drift);
  }, [drift, driftEnabled]);

  const driftStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1.5 + drift.value * 0.25 },
      { rotate: `${-6 + drift.value * 12}deg` },
      { translateY: -20 + drift.value * 40 },
    ],
  }));

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.background }]}
    >
      <AccentGlow color={accentColor} opacity={0.55} />
      {coverUrl ? (
        <Animated.View style={[StyleSheet.absoluteFill, driftStyle]}>
          <Image
            source={{ uri: coverUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={60}
            transition={MOTION.dur.glide}
          />
        </Animated.View>
      ) : null}
      <LinearGradient
        colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.75)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
