import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/MiniPlayer';
import { PlaylistScreen } from '@/components/screens/PlaylistScreen';
import { COLORS } from '@/constants/colors';
import { useOverlayStore } from '@/store/useOverlayStore';

export function PlaylistOverlay() {
  const playlistId = useOverlayStore((s) => s.playlistId);
  const closePlaylist = useOverlayStore((s) => s.closePlaylist);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!playlistId) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closePlaylist();
      return true;
    });

    return () => sub.remove();
  }, [playlistId, closePlaylist]);

  if (!playlistId) return null;

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
        zIndex: 990,
        backgroundColor: COLORS.background,
      }}
    >
      <PlaylistScreen id={playlistId} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: (insets.bottom > 0 ? insets.bottom : 8) + 16,
        }}
        pointerEvents="box-none"
      >
        <MiniPlayer />
      </View>
    </Animated.View>
  );
}
