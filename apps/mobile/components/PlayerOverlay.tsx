import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { GlassArtworkBackdrop } from '@/components/glass/GlassArtworkBackdrop';
import {
  glassPresentEntering,
  glassPresentExiting,
} from '@/components/glass/transitions';
import PlayerScreen from '@/components/PlayerScreen';
import { COLORS } from '@/constants/colors';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useGlassMode } from '@/hooks/useGlassMode';
import { usePlayerStore } from '@/store/usePlayerStore';

export function PlayerOverlay() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlayerOpen = usePlayerStore((s) => s.isPlayerOpen);
  const glassMode = useGlassMode();
  const accentColor = useDynamicAccent();

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
      entering={
        glassMode
          ? glassPresentEntering()
          : SlideInDown.duration(350).damping(28)
      }
      exiting={glassMode ? glassPresentExiting() : SlideOutDown.duration(300)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        backgroundColor: COLORS.background,
        overflow: glassMode ? 'hidden' : undefined,
      }}
    >
      {glassMode ? (
        <GlassArtworkBackdrop
          coverUrl={currentTrack.coverUrl}
          accentColor={accentColor}
        />
      ) : null}
      <PlayerScreen />
    </Animated.View>
  );
}
