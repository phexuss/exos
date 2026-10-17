import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { GlassAmbientBackground } from '@/components/glass/GlassAmbientBackground';
import {
  glassPushEntering,
  glassPushExiting,
} from '@/components/glass/transitions';
import { SettingsScreen } from '@/components/screens/SettingsScreen';
import { COLORS } from '@/constants/colors';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useOverlayStore } from '@/store/useOverlayStore';

export function SettingsOverlay() {
  const glassMode = useGlassMode();
  const isSettingsOpen = useOverlayStore((s) => s.isSettingsOpen);
  const closeSettings = useOverlayStore((s) => s.closeSettings);

  useEffect(() => {
    if (!isSettingsOpen) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSettings();
      return true;
    });

    return () => sub.remove();
  }, [isSettingsOpen, closeSettings]);

  if (!isSettingsOpen) return null;

  return (
    <Animated.View
      entering={glassMode ? glassPushEntering() : SlideInRight.duration(280)}
      exiting={glassMode ? glassPushExiting() : SlideOutRight.duration(240)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1001,
        backgroundColor: COLORS.background,
      }}
    >
      {glassMode ? <GlassAmbientBackground /> : null}
      <SettingsScreen />
    </Animated.View>
  );
}
