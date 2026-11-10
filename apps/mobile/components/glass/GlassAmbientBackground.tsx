import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AccentGlow } from '@/components/motion/AccentGlow';
import { COLORS } from '@/constants/colors';
import { MOTION } from '@/constants/motion';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { usePlayerStore } from '@/store/usePlayerStore';

/**
 * The ambient layer behind every screen in Glass mode, after the desktop
 * `.ambient`: the current cover, heavily blurred, fills the whole screen
 * under a veil that is light at the top and deep at the bottom. The colour
 * reaches the tab bar and the mini player, so the glass there has something
 * to sit on instead of flat black. Static on purpose: a moving layer under
 * scrolling lists costs frames on Android.
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
          bottom: 0,
          overflow: 'hidden',
        }}
      >
        <AccentGlow color={accentColor} opacity={0.35} />
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={[
              StyleSheet.absoluteFill,
              { opacity: 0.6, transform: [{ scale: 1.6 }] },
            ]}
            contentFit="cover"
            blurRadius={80}
            transition={MOTION.dur.glide}
          />
        ) : null}
        <LinearGradient
          colors={[
            'rgba(18,18,18,0.25)',
            'rgba(18,18,18,0.62)',
            'rgba(18,18,18,0.8)',
          ]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}
