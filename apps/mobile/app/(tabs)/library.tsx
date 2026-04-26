import { useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  type ListRenderItem,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useI18n } from '@/hooks/useI18n';
import {
  getDownloadedTracks,
  getPlaylists,
  type PlaylistRow,
} from '@/services/db/database';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

type PlaylistCardProps = {
  id: string;
  name: string;
  coverUrl: string | null;
  trackCount: number;
};

function PlaylistCardComponent({
  id,
  name,
  coverUrl,
  trackCount,
}: PlaylistCardProps) {
  const handlePress = useCallback(() => {
    useOverlayStore.getState().openPlaylist(id);
  }, [id]);

  return (
    <Pressable onPress={handlePress} style={{ width: 120, gap: 8 }}>
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 12,
          }}
        />
      ) : (
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 12,
            backgroundColor: COLORS.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}
        >
          <AppIcon name="playlist" size={32} color={COLORS.textMuted} />
        </View>
      )}
      <AppText
        variant="caption"
        weight="medium"
        numberOfLines={1}
        style={{ color: COLORS.textPrimary }}
      >
        {name}
      </AppText>
      <AppText
        variant="caption"
        style={{
          color: COLORS.textMuted,
          fontSize: 11,
          marginTop: -6,
        }}
      >
        {trackCount} tracks
      </AppText>
    </Pressable>
  );
}

const PlaylistCard = memo(PlaylistCardComponent);

export default function LibraryScreen() {
  const { t } = useI18n();
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const accentColor = useDynamicAccent();
  const revision = useDownloadStore((s) => s.revision);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, p] = await Promise.all([getDownloadedTracks(), getPlaylists()]);
      setTracks(t);
      setPlaylists(p);
    } catch (e) {
      console.warn('Library fetch error:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [revision, load]);

  const handlePlay = useCallback(
    (track: Track) => {
      play(track);
      setQueue(tracks);
    },
    [play, setQueue, tracks],
  );

  const handleLongPress = useCallback(
    (track: Track) => setSelectedTrack(track),
    [],
  );

  const renderTrack = useCallback<ListRenderItem<Track>>(
    ({ item }) => (
      <TrackItem
        track={item}
        onPress={handlePlay}
        onLongPress={handleLongPress}
        isActive={currentTrackId === item.id}
        accentColor={accentColor}
      />
    ),
    [handlePlay, handleLongPress, currentTrackId, accentColor],
  );

  const keyExtractor = useCallback((item: Track) => item.id, []);

  const ListHeader = (
    <View style={{ gap: SPACING.xxl }}>
      <AppText variant="display" weight="bold">
        {t('library.title')}
      </AppText>

      <View style={{ gap: 12 }}>
        <AppText
          variant="label"
          weight="medium"
          style={{
            color: COLORS.textSecondary,
            letterSpacing: 1,
            fontSize: 11,
          }}
        >
          {t('library.playlists').toUpperCase()}
        </AppText>
        {playlists.length === 0 ? (
          <View
            style={{
              paddingVertical: 24,
              alignItems: 'center',
              gap: 8,
              borderTopWidth: 0.5,
              borderTopColor: COLORS.border,
            }}
          >
            <AppIcon name="playlist" size={24} color={COLORS.textMuted} />
            <AppText variant="caption" style={{ color: COLORS.textMuted }}>
              Long press a track to create
            </AppText>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
            style={{
              marginHorizontal: -SPACING.lg,
              paddingHorizontal: SPACING.lg,
            }}
          >
            {playlists.map((pl) => (
              <PlaylistCard
                key={pl.id}
                id={pl.id}
                name={pl.name}
                coverUrl={pl.cover_url}
                trackCount={pl.track_count}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <AppText
          variant="label"
          weight="medium"
          style={{
            color: COLORS.textSecondary,
            letterSpacing: 1,
            fontSize: 11,
          }}
        >
          DOWNLOADED
        </AppText>
        <AppText
          variant="caption"
          style={{ color: COLORS.textMuted, fontSize: 11 }}
        >
          {tracks.length}
        </AppText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlatList
        data={tracks}
        keyExtractor={keyExtractor}
        renderItem={renderTrack}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
            <AppIcon name="download" size={28} color={COLORS.textMuted} />
            <AppText variant="caption" style={{ color: COLORS.textMuted }}>
              No downloads yet
            </AppText>
          </View>
        }
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.md,
          paddingBottom: 100,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews
      />

      <TrackActionsSheet
        track={selectedTrack}
        visible={!!selectedTrack}
        onClose={() => setSelectedTrack(null)}
        onDeleted={load}
      />
    </SafeAreaView>
  );
}
