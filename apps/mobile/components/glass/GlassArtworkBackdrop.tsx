import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { COLORS } from '@/constants/colors';

type GlassArtworkBackdropProps = {
  coverUrl?: string;
  accentColor: string;
};

const DRIFT_MS = 18000;

// On Android every frame of the drift makes each native blur on screen
// re-capture and re-blur its whole source view, so the backdrop stays still.
const DRIFT_ENABLED = Platform.OS !== 'android';

/**
 * Full-bleed, heavily blurred album art that slowly drifts and breathes —
 * the living backdrop the player's glass sits on. Static on Android.
 */
export function GlassArtworkBackdrop({
  coverUrl,
  accentColor,
}: GlassArtworkBackdropProps) {
  const drift = useSharedValue(0);

  useEffect(() => {
    if (!DRIFT_ENABLED) return;
    drift.value = withRepeat(
      withTiming(1, { duration: DRIFT_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [drift]);

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
      <LinearGradient
        colors={[accentColor, COLORS.background]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.55 }]}
      />
      {coverUrl ? (
        <Animated.View style={[StyleSheet.absoluteFill, driftStyle]}>
          <Image
            source={{ uri: coverUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={60}
            transition={700}
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
