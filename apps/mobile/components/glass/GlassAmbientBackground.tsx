import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { usePlayerStore } from '@/store/usePlayerStore';

const GLOW_HEIGHT = '62%';

/**
 * Soft ambient glow behind the tab screens in Glass mode: the current cover,
 * heavily blurred and faded into the background, so glass chrome has color
 * to refract. Static on purpose — a moving layer under scrolling lists costs
 * frames on Android.
 */
export function GlassAmbientBackground() {
  const coverUrl = usePlayerStore((s) => s.currentTrack?.coverUrl);
  const accentColor = useDynamicAccent();

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.background }]}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: GLOW_HEIGHT,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={[accentColor, COLORS.background]}
          style={[StyleSheet.absoluteFill, { opacity: 0.35 }]}
        />
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={[
              StyleSheet.absoluteFill,
              { opacity: 0.55, transform: [{ scale: 1.6 }] },
            ]}
            contentFit="cover"
            blurRadius={80}
            transition={900}
          />
        ) : null}
        <LinearGradient
          colors={[
            'rgba(18,18,18,0.2)',
            'rgba(18,18,18,0.7)',
            COLORS.background,
          ]}
          locations={[0, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}
