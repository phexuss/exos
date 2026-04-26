import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { ProfileScreen } from '@/components/screens/ProfileScreen';
import { COLORS } from '@/constants/colors';
import { useOverlayStore } from '@/store/useOverlayStore';

export function ProfileOverlay() {
  const isProfileOpen = useOverlayStore((s) => s.isProfileOpen);
  const isSettingsOpen = useOverlayStore((s) => s.isSettingsOpen);
  const closeProfile = useOverlayStore((s) => s.closeProfile);

  useEffect(() => {
    if (!isProfileOpen || isSettingsOpen) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeProfile();
      return true;
    });

    return () => sub.remove();
  }, [isProfileOpen, isSettingsOpen, closeProfile]);

  if (!isProfileOpen) return null;

  return (
    <Animated.View
      entering={SlideInDown.duration(350).damping(28)}
      exiting={SlideOutDown.duration(300)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: COLORS.background,
      }}
    >
      <ProfileScreen />
    </Animated.View>
  );
}
