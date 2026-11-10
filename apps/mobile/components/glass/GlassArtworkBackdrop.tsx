import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { AccentGlow } from '@/components/motion/AccentGlow';
import { COLORS } from '@/constants/colors';
import { MOTION, prefersReducedMotion } from '@/constants/motion';
import { useSettingsStore } from '@/store/useSettingsStore';

type GlassArtworkBackdropProps = {
  coverUrl?: string;
  accentColor: string;
  /** Stops the drift (the player is put away). */
  paused?: boolean;
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
 * the living backdrop the player's glass sits on.
 */
export function GlassArtworkBackdrop({
  coverUrl,
  accentColor,
  paused = false,
}: GlassArtworkBackdropProps) {
  // React Native Animated on the native driver: a Reanimated loop here ran a
  // UI-thread animation, and on Android a shadow-tree commit, every frame
  // the player was open.
  const [drift] = useState(() => new Animated.Value(0));
  const driftEnabled = useDriftEnabled() && !paused;

  useEffect(() => {
    if (!driftEnabled || prefersReducedMotion()) {
      drift.stopAnimation();
      drift.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: DRIFT_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: DRIFT_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, driftEnabled]);

  const driftStyle = useMemo(
    () => ({
      transform: [
        {
          scale: drift.interpolate({
            inputRange: [0, 1],
            outputRange: [1.5, 1.75],
          }),
        },
        {
          rotate: drift.interpolate({
            inputRange: [0, 1],
            outputRange: ['-6deg', '6deg'],
          }),
        },
        {
          translateY: drift.interpolate({
            inputRange: [0, 1],
            outputRange: [-20, 20],
          }),
        },
      ],
    }),
    [drift],
  );

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
