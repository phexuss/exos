import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassAmbientBackground } from '@/components/glass/GlassAmbientBackground';
import { MiniPlayer } from '@/components/MiniPlayer';
import { Presence, useHeld } from '@/components/motion/Presence';
import { PlaylistScreen } from '@/components/screens/PlaylistScreen';
import { COLORS } from '@/constants/colors';
import { SECONDARY_BLUR } from '@/constants/glass';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useOverlayStore } from '@/store/useOverlayStore';

export function PlaylistOverlay() {
  const glassMode = useGlassMode();
  const playlistId = useOverlayStore((s) => s.playlistId);
  const closePlaylist = useOverlayStore((s) => s.closePlaylist);
  const shownId = useHeld(playlistId);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!playlistId) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closePlaylist();
      return true;
    });

    return () => sub.remove();
  }, [playlistId, closePlaylist]);

  return (
    <Presence
      visible={!!playlistId}
      from="right"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 990,
        backgroundColor: COLORS.background,
      }}
    >
      {glassMode ? <GlassAmbientBackground /> : null}
      {shownId ? <PlaylistScreen id={shownId} /> : null}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: (insets.bottom > 0 ? insets.bottom : 8) + 16,
        }}
        pointerEvents="box-none"
      >
        {/* Overlays sit outside every navigation screen, so on Android a blur
            here would re-capture the whole app, hidden tabs included, on
            each frame. The opaque glow behind needs only the tint. */}
        <MiniPlayer blur={SECONDARY_BLUR} />
      </View>
    </Presence>
  );
}
