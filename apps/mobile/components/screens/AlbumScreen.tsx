import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  type ListRenderItem,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { type AlbumDetail, getAlbumDetail } from '@/services/api/albums';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

type Props = {
  id: string;
  titleHint?: string;
};

export function AlbumScreen({ id, titleHint }: Props) {
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const closeAlbum = useOverlayStore((s) => s.closeAlbum);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getAlbumDetail(id)
      .then((a) => {
        if (!cancelled) setAlbum(a);
      })
      .catch((e) => {
        if (!cancelled) console.warn('[Album] Load error:', e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handlePlay = useCallback(
    (track: Track) => {
      if (album) setQueue(album.tracks);
      play(track);
    },
    [play, setQueue, album],
  );

  const renderTrack = useCallback<ListRenderItem<Track>>(
    ({ item }) => (
      <View style={{ paddingHorizontal: 12 }}>
        <TrackItem
          track={item}
          onPress={handlePlay}
          isActive={currentTrackId === item.id}
          showDownload
        />
      </View>
    ),
    [handlePlay, currentTrackId],
  );

  const keyExtractor = useCallback((item: Track) => item.id, []);

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={COLORS.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (!album) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppText variant="body" style={{ color: COLORS.textMuted }}>
          Album not found
        </AppText>
      </SafeAreaView>
    );
  }

  const ListHeader = (
    <View style={{ gap: 16, alignItems: 'center', paddingVertical: 16 }}>
      {/* Back button */}
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          paddingHorizontal: 16,
        }}
      >
        <Pressable
          onPress={closeAlbum}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: COLORS.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="chevron-down" size={20} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {/* Cover */}
      {album.coverUrl ? (
        <Image
          source={{ uri: album.coverUrl }}
          style={{ width: 200, height: 200, borderRadius: 16 }}
        />
      ) : (
        <View
          style={{
            width: 200,
            height: 200,
            borderRadius: 16,
            backgroundColor: COLORS.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="music-notes" size={48} color={COLORS.textMuted} />
        </View>
      )}

      <View style={{ alignItems: 'center', gap: 4 }}>
        <AppText
          variant="title"
          weight="bold"
          numberOfLines={2}
          style={{
            color: COLORS.textPrimary,
            textAlign: 'center',
            paddingHorizontal: 32,
          }}
        >
          {album.title}
        </AppText>
        {album.artistName ? (
          <AppText variant="caption" style={{ color: COLORS.textMuted }}>
            {album.artistName}
          </AppText>
        ) : null}
        <AppText variant="caption" style={{ color: COLORS.textMuted }}>
          {album.tracks.length} tracks
        </AppText>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <FlatList
        data={album.tracks}
        keyExtractor={keyExtractor}
        renderItem={renderTrack}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 100 }}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}
