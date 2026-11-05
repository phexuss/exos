import { useEffect } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { GlassArtworkBackdrop } from '@/components/glass/GlassArtworkBackdrop';
import {
  glassPresentEntering,
  glassPresentExiting,
} from '@/components/glass/transitions';
import { useDragToDismiss } from '@/components/motion/useDragToDismiss';
import PlayerScreen from '@/components/PlayerScreen';
import { COLORS } from '@/constants/colors';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useGlassMode } from '@/hooks/useGlassMode';
import { usePlayerStore } from '@/store/usePlayerStore';

const closePlayer = () => usePlayerStore.getState().closePlayer();

/**
 * The open player. Mounted only while open, so the drag starts from rest
 * every time it is presented.
 */
function PlayerSheet({ glassMode }: { glassMode: boolean }) {
  const coverUrl = usePlayerStore((s) => s.currentTrack?.coverUrl);
  const accentColor = useDynamicAccent();
  const dismiss = useDragToDismiss(closePlayer);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { overflow: 'hidden', backgroundColor: COLORS.background },
        dismiss.style,
      ]}
    >
      {glassMode ? (
        <GlassArtworkBackdrop coverUrl={coverUrl} accentColor={accentColor} />
      ) : null}
      <PlayerScreen
        dismissGesture={{
          body: dismiss.gesture,
          handle: dismiss.handleGesture,
        }}
      />
    </Animated.View>
  );
}

export function PlayerOverlay() {
  const hasTrack = usePlayerStore((s) => !!s.currentTrack);
  const isPlayerOpen = usePlayerStore((s) => s.isPlayerOpen);
  const glassMode = useGlassMode();

  useEffect(() => {
    if (!isPlayerOpen) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closePlayer();
      return true;
    });

    return () => sub.remove();
  }, [isPlayerOpen]);

  if (!hasTrack || !isPlayerOpen) return null;

  return (
    <Animated.View
      entering={
        glassMode
          ? glassPresentEntering()
          : SlideInDown.duration(350).damping(28)
      }
      exiting={glassMode ? glassPresentExiting() : SlideOutDown.duration(300)}
      style={[StyleSheet.absoluteFill, { zIndex: 999 }]}
    >
      <PlayerSheet glassMode={glassMode} />
    </Animated.View>
  );
}
