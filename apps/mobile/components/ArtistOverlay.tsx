import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlbumScreen } from '@/components/screens/AlbumScreen';
import { ArtistScreen } from '@/components/screens/ArtistScreen';
import { MiniPlayer } from '@/components/MiniPlayer';
import { COLORS } from '@/constants/colors';
import { useOverlayStore } from '@/store/useOverlayStore';

export function ArtistOverlay() {
  const artistId = useOverlayStore((s) => s.artistId);
  const albumId = useOverlayStore((s) => s.albumId);
  const albumTitle = useOverlayStore((s) => s.albumTitle);
  const closeArtist = useOverlayStore((s) => s.closeArtist);
  const closeAlbum = useOverlayStore((s) => s.closeAlbum);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!artistId) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (albumId) {
        closeAlbum();
      } else {
        closeArtist();
      }
      return true;
    });

    return () => sub.remove();
  }, [artistId, albumId, closeArtist, closeAlbum]);

  if (!artistId) return null;

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
        zIndex: 995,
        backgroundColor: COLORS.background,
      }}
    >
      <ArtistScreen id={artistId} />

      {/* Album sub-overlay (slides on top of artist) */}
      {albumId && (
        <Animated.View
          entering={SlideInRight.duration(260)}
          exiting={SlideOutRight.duration(220)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: COLORS.background,
          }}
        >
          <AlbumScreen id={albumId} titleHint={albumTitle ?? undefined} />
        </Animated.View>
      )}

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
