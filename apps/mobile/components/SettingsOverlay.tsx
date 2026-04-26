import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';

import { SettingsScreen } from '@/components/screens/SettingsScreen';
import { COLORS } from '@/constants/colors';
import { useOverlayStore } from '@/store/useOverlayStore';

export function SettingsOverlay() {
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
      entering={SlideInRight.duration(280)}
      exiting={SlideOutRight.duration(240)}
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
      <SettingsScreen />
    </Animated.View>
  );
}
