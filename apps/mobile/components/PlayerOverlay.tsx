import { useEffect, useMemo, useState } from 'react';
import { Freeze } from 'react-freeze';
import {
  BackHandler,
  Animated as RNAnimated,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import { GlassArtworkBackdrop } from '@/components/glass/GlassArtworkBackdrop';
import {
  playerOpen,
  syncPlayerSheet,
  usePlayerPresented,
} from '@/components/motion/playerMotion';
import { useDragToDismiss } from '@/components/motion/useDragToDismiss';
import PlayerScreen from '@/components/PlayerScreen';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useGlassMode } from '@/hooks/useGlassMode';
import { usePlayerStore } from '@/store/usePlayerStore';

const closePlayer = () => usePlayerStore.getState().closePlayer();

/** How dark the screen behind gets by the time the player covers it. */
const SCRIM = 0.6;
/**
 * The player is built this long after the first track starts, so that tap
 * pays for the mini player alone and the first open finds it ready.
 */
const WARM_UP_MS = 600;

function PlayerSheetBody({
  glassMode,
  active,
}: {
  glassMode: boolean;
  active: boolean;
}) {
  const coverUrl = usePlayerStore((s) => s.currentTrack?.coverUrl);
  const accentColor = useDynamicAccent();
  const dismiss = useDragToDismiss();
  const dismissGesture = useMemo(
    () => ({ body: dismiss.gesture, handle: dismiss.handleGesture }),
    [dismiss.gesture, dismiss.handleGesture],
  );

  return (
    <>
      {glassMode ? (
        <GlassArtworkBackdrop
          coverUrl={coverUrl}
          accentColor={accentColor}
          paused={!active}
        />
      ) : null}
      <PlayerScreen dismissGesture={dismissGesture} active={active} />
    </>
  );
}

/**
 * The full-screen player. Once a track exists it stays mounted under the
 * bottom edge, so opening it is one transform on the native driver and never
 * a mount in the middle of the animation. While it is put away its subtree
 * is frozen: track changes and progress ticks don't render it, and its
 * loops are stopped first.
 */
export function PlayerOverlay() {
  const hasTrack = usePlayerStore((s) => !!s.currentTrack);
  const isPlayerOpen = usePlayerStore((s) => s.isPlayerOpen);
  const presented = usePlayerPresented((s) => s.presented);
  const glassMode = useGlassMode();
  const { height } = useWindowDimensions();
  const open = hasTrack && isPlayerOpen;
  const [ready, setReady] = useState(false);
  // Freezing waits one render, so the screen first sees `active` go false
  // and stops its loops; thawing is immediate.
  const [rested, setRested] = useState(true);

  useEffect(() => {
    setRested(!presented);
  }, [presented]);

  useEffect(() => {
    if (ready || !hasTrack) return;
    if (presented) {
      setReady(true);
      return;
    }
    const timer = setTimeout(() => setReady(true), WARM_UP_MS);
    return () => clearTimeout(timer);
  }, [ready, hasTrack, presented]);

  useEffect(() => {
    syncPlayerSheet(open);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closePlayer();
      return true;
    });

    return () => sub.remove();
  }, [open]);

  const motion = useMemo(
    () => ({
      scrim: {
        opacity: playerOpen.interpolate({
          inputRange: [0, 1],
          outputRange: [0, SCRIM],
          extrapolate: 'clamp',
        }),
      },
      sheet: {
        transform: [
          {
            translateY: playerOpen.interpolate({
              inputRange: [0, 1],
              outputRange: [height, 0],
              extrapolate: 'clamp',
            }),
          },
        ],
      },
    }),
    [height],
  );

  if (!hasTrack || !ready) return null;

  return (
    <>
      <RNAnimated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { zIndex: 998, backgroundColor: GLASS.shadow },
          motion.scrim,
        ]}
      />
      <RNAnimated.View
        pointerEvents={open ? 'auto' : 'none'}
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        style={[
          StyleSheet.absoluteFill,
          {
            zIndex: 999,
            overflow: 'hidden',
            backgroundColor: COLORS.background,
            // Seen only on the way up and down: at rest the corners sit
            // under the rounded corners of the display.
            borderTopLeftRadius: GLASS.radius.sheet,
            borderTopRightRadius: GLASS.radius.sheet,
          },
          motion.sheet,
        ]}
      >
        <Freeze freeze={!presented && rested}>
          <PlayerSheetBody glassMode={glassMode} active={presented} />
        </Freeze>
      </RNAnimated.View>
    </>
  );
}
