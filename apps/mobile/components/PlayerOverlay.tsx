import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { COLORS } from '@/constants/colors';
import { usePlayerStore } from '@/store/usePlayerStore';
import PlayerScreen from '@/components/PlayerScreen';

export function PlayerOverlay() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlayerOpen = usePlayerStore((s) => s.isPlayerOpen);

  useEffect(() => {
    if (!isPlayerOpen) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      usePlayerStore.getState().closePlayer();
      return true;
    });

    return () => sub.remove();
  }, [isPlayerOpen]);

  if (!currentTrack || !isPlayerOpen) return null;

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
        zIndex: 999,
        backgroundColor: COLORS.background,
      }}
    >
      <PlayerScreen />
    </Animated.View>
  );
}
