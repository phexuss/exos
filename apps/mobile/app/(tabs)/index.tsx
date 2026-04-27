import { memo, useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  type ListRenderItem,
  Pressable,
  View,
} from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SourceBadge } from '@/components/SourceBadge';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { COLORS } from '@/constants/colors';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useI18n } from '@/hooks/useI18n';
import { mapDeezerTrackToTrack } from '@/services/adapters/search.adapter';
import { getChart } from '@/services/api/search';
import { getRecentlyPlayed } from '@/services/db/database';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { DeezerAlbum, DeezerArtist } from '@/types/deezer';
import type { Track } from '@/types/domain';

type RecentCardProps = {
  track: Track;
  onPress: (track: Track) => void;
  isActive?: boolean;
  accentColor?: string;
};

function RecentCardComponent({
  track,
  onPress,
  isActive,
  accentColor,
}: RecentCardProps) {
  const handlePress = useCallback(() => onPress(track), [onPress, track]);
  const activeColor = accentColor ?? COLORS.accent;
  return (
    <AnimatedPressable
      scaleValue={0.95}
      onPress={handlePress}
      style={{
        width: 160,
        gap: 10,
      }}
    >
      {track.coverUrl ? (
        <Image
          source={{ uri: track.coverUrl }}
          style={{
            width: 160,
            height: 160,
            borderRadius: 14,
            borderWidth: isActive ? 2 : 0,
            borderColor: isActive ? activeColor : 'transparent',
          }}
        />
      ) : (
        <View
          style={{
            width: 160,
            height: 160,
            borderRadius: 14,
            backgroundColor: COLORS.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}
        >
          <AppIcon name="music" size={32} color={COLORS.textMuted} />
        </View>
      )}
      <View style={{ gap: 3 }}>
        <AppText
          variant="body"
          weight="medium"
          style={{
            color: isActive ? activeColor : COLORS.textPrimary,
            fontSize: 14,
          }}
          numberOfLines={1}
        >
          {track.title}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <AppText
            variant="caption"
            style={{ color: COLORS.textMuted, fontSize: 12 }}
            numberOfLines={1}
          >
            {track.artist.name}
          </AppText>
          <SourceBadge source={track.source} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const RecentCard = memo(RecentCardComponent);

function ArtistCardComponent({
  artist,
  onPress,
}: {
  artist: DeezerArtist;
  onPress: (artist: DeezerArtist) => void;
}) {
  const handlePress = useCallback(() => onPress(artist), [onPress, artist]);
  return (
    <AnimatedPressable
      scaleValue={0.95}
      onPress={handlePress}
      style={{ width: 80, alignItems: 'center', gap: 8 }}
    >
      {artist.picture_medium ? (
        <Image
          source={{ uri: artist.picture_medium }}
          style={{ width: 64, height: 64, borderRadius: 32 }}
        />
      ) : (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: COLORS.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="profile" size={24} color={COLORS.textMuted} />
        </View>
      )}
      <AppText
        variant="caption"
        style={{ color: COLORS.textSecondary, fontSize: 11, textAlign: 'center' }}
        numberOfLines={1}
      >
        {artist.name}
      </AppText>
    </AnimatedPressable>
  );
}

const ArtistCard = memo(ArtistCardComponent);

function AlbumCardComponent({
  album,
  onPress,
}: {
  album: DeezerAlbum;
  onPress: (album: DeezerAlbum) => void;
}) {
  const handlePress = useCallback(() => onPress(album), [onPress, album]);
  return (
    <AnimatedPressable
      scaleValue={0.95}
      onPress={handlePress}
      style={{ width: 120, gap: 8 }}
    >
      {album.cover_medium ? (
        <Image
          source={{ uri: album.cover_medium }}
          style={{ width: 120, height: 120, borderRadius: 12 }}
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
          }}
        >
          <AppIcon name="music" size={28} color={COLORS.textMuted} />
        </View>
      )}
      <AppText
        variant="caption"
        weight="medium"
        style={{ color: COLORS.textPrimary, fontSize: 12 }}
        numberOfLines={1}
      >
        {album.title}
      </AppText>
    </AnimatedPressable>
  );
}

const AlbumCard = memo(AlbumCardComponent);

function SkeletonRow({ count, width, height, radius }: { count: number; width: number; height: number; radius: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width,
            height,
            borderRadius: radius,
            backgroundColor: COLORS.surfaceMuted,
            opacity: 0.4,
          }}
        />
      ))}
    </View>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <AppText
      variant="label"
      weight="medium"
      style={{ color: COLORS.textSecondary, letterSpacing: 1, fontSize: 12 }}
    >
      {label.toUpperCase()}
    </AppText>
  );
}

export default function HomeScreen() {
  const { t } = useI18n();
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const accentColor = useDynamicAccent();
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [chartTracks, setChartTracks] = useState<Track[]>([]);
  const [chartArtists, setChartArtists] = useState<DeezerArtist[]>([]);
  const [chartAlbums, setChartAlbums] = useState<DeezerAlbum[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const { hasSeenFaq, setHasSeenFaq } = useSettingsStore.getState();
    if (!hasSeenFaq) {
      useOverlayStore.getState().openFaq();
      setHasSeenFaq(true);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      getRecentlyPlayed(20).catch(() => [] as Track[]),
      getChart().catch(() => null),
    ]).then(([recent, chart]) => {
      setRecentTracks(recent);
      if (chart) {
        setChartTracks(chart.tracks.data.map(mapDeezerTrackToTrack));
        setChartArtists(chart.artists.data);
        setChartAlbums(chart.albums.data);
      }
      setChartLoading(false);
    });
  }, []);

  const handlePlay = useCallback(
    (track: Track, queue: Track[]) => {
      setQueue(queue);
      play(track);
    },
    [setQueue, play],
  );

  const handlePlayRecent = useCallback(
    (track: Track) => handlePlay(track, recentTracks),
    [handlePlay, recentTracks],
  );

  const handlePlayChart = useCallback(
    (track: Track) => handlePlay(track, chartTracks),
    [handlePlay, chartTracks],
  );

  const handleArtistPress = useCallback((artist: DeezerArtist) => {
    useOverlayStore.getState().openArtist(String(artist.id));
  }, []);

  const handleAlbumPress = useCallback((album: DeezerAlbum) => {
    useOverlayStore.getState().openAlbum(String(album.id), album.title);
  }, []);

  const renderRecentCard = useCallback<ListRenderItem<Track>>(
    ({ item }) => (
      <RecentCard
        track={item}
        onPress={handlePlayRecent}
        isActive={currentTrackId === item.id}
        accentColor={accentColor}
      />
    ),
    [handlePlayRecent, currentTrackId, accentColor],
  );

  const renderChartCard = useCallback<ListRenderItem<Track>>(
    ({ item }) => (
      <RecentCard
        track={item}
        onPress={handlePlayChart}
        isActive={currentTrackId === item.id}
        accentColor={accentColor}
      />
    ),
    [handlePlayChart, currentTrackId, accentColor],
  );

  const renderArtistCard = useCallback<ListRenderItem<DeezerArtist>>(
    ({ item }) => <ArtistCard artist={item} onPress={handleArtistPress} />,
    [handleArtistPress],
  );

  const renderAlbumCard = useCallback<ListRenderItem<DeezerAlbum>>(
    ({ item }) => <AlbumCard album={item} onPress={handleAlbumPress} />,
    [handleAlbumPress],
  );

  const keyExtractor = useCallback((item: Track) => item.id, []);
  const artistKeyExtractor = useCallback((item: DeezerArtist) => String(item.id), []);
  const albumKeyExtractor = useCallback((item: DeezerAlbum) => String(item.id), []);

  return (
    <ScreenContainer>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <AppText variant="display" weight="bold" style={{ letterSpacing: 2 }}>
          EXØS
        </AppText>
        <Pressable
          onPress={() => useOverlayStore.getState().openProfile()}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: COLORS.surfaceMuted,
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}
        >
          <AppIcon name="profile" size={18} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      {recentTracks.length > 0 && (
        <View style={{ gap: 14 }}>
          <SectionHeader label={t('home.recentlyPlayed')} />
          <FlatList
            data={recentTracks}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ gap: 14 }}
            renderItem={renderRecentCard}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={5}
          />
        </View>
      )}

      <View style={{ gap: 14 }}>
        <SectionHeader label={t('home.chartTracks')} />
        {chartLoading ? (
          <SkeletonRow count={3} width={160} height={160} radius={14} />
        ) : (
          <FlatList
            data={chartTracks}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ gap: 14 }}
            renderItem={renderChartCard}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={5}
          />
        )}
      </View>

      <View style={{ gap: 14 }}>
        <SectionHeader label={t('home.topArtists')} />
        {chartLoading ? (
          <SkeletonRow count={4} width={64} height={64} radius={32} />
        ) : (
          <FlatList
            data={chartArtists}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={artistKeyExtractor}
            contentContainerStyle={{ gap: 14 }}
            renderItem={renderArtistCard}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={5}
          />
        )}
      </View>

      <View style={{ gap: 14 }}>
        <SectionHeader label={t('home.topAlbums')} />
        {chartLoading ? (
          <SkeletonRow count={3} width={120} height={120} radius={12} />
        ) : (
          <FlatList
            data={chartAlbums}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={albumKeyExtractor}
            contentContainerStyle={{ gap: 14 }}
            renderItem={renderAlbumCard}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={5}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
