import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { memo, useCallback, useEffect, useState } from 'react';
import { Image, Pressable, View } from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SourceBadge } from '@/components/SourceBadge';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Skeleton } from '@/components/ui/Skeleton';
import { COLORS } from '@/constants/colors';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useI18n } from '@/hooks/useI18n';
import { mapDeezerTrackToTrack } from '@/services/adapters/search.adapter';
import { getChart } from '@/services/api/search';
import { getSimilarTracks, type SimilarTrack } from '@/services/api/similar';
import { getRecentlyPlayed } from '@/services/db/database';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
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
            style={{ color: COLORS.textMuted, fontSize: 12, flexShrink: 1 }}
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

type SimilarCardProps = {
  item: SimilarTrack;
  onPress: (item: SimilarTrack) => void;
  isActive?: boolean;
  accentColor?: string;
};

function SimilarCardComponent({
  item,
  onPress,
  isActive,
  accentColor,
}: SimilarCardProps) {
  const handlePress = useCallback(() => onPress(item), [onPress, item]);
  const activeColor = accentColor ?? COLORS.accent;
  return (
    <AnimatedPressable
      scaleValue={0.95}
      onPress={handlePress}
      style={{ width: 130, gap: 8 }}
    >
      <View>
        {item.coverUrl ? (
          <Image
            source={{ uri: item.coverUrl }}
            style={{
              width: 130,
              height: 130,
              borderRadius: 12,
              borderWidth: isActive ? 2 : 0,
              borderColor: isActive ? activeColor : 'transparent',
            }}
          />
        ) : (
          <View
            style={{
              width: 130,
              height: 130,
              borderRadius: 12,
              backgroundColor: COLORS.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 0.5,
              borderColor: COLORS.border,
            }}
          >
            <AppIcon name="music" size={28} color={COLORS.textMuted} />
          </View>
        )}
      </View>
      <View style={{ gap: 3 }}>
        <AppText
          variant="body"
          weight="medium"
          style={{
            color: isActive ? activeColor : COLORS.textPrimary,
            fontSize: 13,
          }}
          numberOfLines={1}
        >
          {item.title}
        </AppText>
        <AppText
          variant="caption"
          style={{ color: COLORS.textMuted, fontSize: 11 }}
          numberOfLines={1}
        >
          {item.artist}
        </AppText>
      </View>
    </AnimatedPressable>
  );
}

const SimilarCard = memo(SimilarCardComponent);

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
        style={{
          color: COLORS.textSecondary,
          fontSize: 11,
          textAlign: 'center',
        }}
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

function SimilarSkeletonRow({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: 130, gap: 8 }}>
          <Skeleton width={130} height={130} radius={12} />
          <View style={{ gap: 4 }}>
            <Skeleton width={100} height={12} radius={4} />
            <Skeleton width={70} height={10} radius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

function TrackSkeletonRow({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: 160, gap: 10 }}>
          <Skeleton width={160} height={160} radius={14} />
          <View style={{ gap: 4 }}>
            <Skeleton width={128} height={12} radius={4} />
            <Skeleton width={80} height={10} radius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

function ArtistSkeletonRow({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: 80, alignItems: 'center', gap: 8 }}>
          <Skeleton width={64} height={64} circle />
          <Skeleton width={50} height={10} radius={4} />
        </View>
      ))}
    </View>
  );
}

function AlbumSkeletonRow({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: 120, gap: 8 }}>
          <Skeleton width={120} height={120} radius={12} />
          <Skeleton width={100} height={12} radius={4} />
        </View>
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

function HorizontalSeparator() {
  return <View style={{ width: 14 }} />;
}

function SignInPromptCard() {
  const { t } = useI18n();
  return (
    <Pressable
      onPress={() => useOverlayStore.getState().openProfile()}
      style={{
        height: 120,
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 20,
      }}
    >
      <AppIcon name="profile" size={24} color={COLORS.textMuted} />
      <AppText
        variant="caption"
        weight="medium"
        style={{ color: COLORS.textMuted, textAlign: 'center', fontSize: 13 }}
      >
        {t('home.signInToAccess')}
      </AppText>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { t } = useI18n();
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const accentColor = useDynamicAccent();
  const user = useAuthStore((s) => s.user);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [chartTracks, setChartTracks] = useState<Track[]>([]);
  const [chartArtists, setChartArtists] = useState<DeezerArtist[]>([]);
  const [chartAlbums, setChartAlbums] = useState<DeezerAlbum[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [similarTracks, setSimilarTracks] = useState<SimilarTrack[] | null>(
    null,
  );
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarArtist, setSimilarArtist] = useState('');

  useEffect(() => {
    const { hasSeenFaq, setHasSeenFaq } = useSettingsStore.getState();
    if (!hasSeenFaq) {
      useOverlayStore.getState().openFaq();
      setHasSeenFaq(true);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const recent = await getRecentlyPlayed(20).catch(() => [] as Track[]);
      setRecentTracks(recent);

      if (!user) {
        setChartLoading(false);
        return;
      }

      if (recent[0]) {
        setSimilarLoading(true);
        setSimilarArtist(recent[0].artist.name);
      }

      const [chart, similar] = await Promise.all([
        getChart().catch(() => null),
        recent[0]
          ? getSimilarTracks(recent[0].artist.name, recent[0].title).catch(
              () => null,
            )
          : Promise.resolve(null),
      ]);

      if (chart) {
        setChartTracks(chart.tracks.data.map(mapDeezerTrackToTrack));
        setChartArtists(chart.artists.data);
        setChartAlbums(chart.albums.data);
      }
      setChartLoading(false);

      setSimilarTracks(similar);
      setSimilarLoading(false);
    })();
  }, [user]);

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

  const handlePlaySimilar = useCallback(
    (item: SimilarTrack) => {
      const track: Track = {
        id: String(item.deezerId),
        title: item.title,
        artist: { id: '', name: item.artist },
        coverUrl: item.coverUrl ?? undefined,
        duration: item.duration
          ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`
          : '0:00',
        durationSec: item.duration ?? 0,
        isrc: item.isrc ?? undefined,
        source: 'deezer',
      };
      play(track);
    },
    [play],
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

  const renderSimilarCard = useCallback<ListRenderItem<SimilarTrack>>(
    ({ item }) => (
      <SimilarCard
        item={item}
        onPress={handlePlaySimilar}
        isActive={currentTrackId === String(item.deezerId)}
        accentColor={accentColor}
      />
    ),
    [handlePlaySimilar, currentTrackId, accentColor],
  );

  const similarKeyExtractor = useCallback(
    (item: SimilarTrack) => String(item.deezerId),
    [],
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
  const artistKeyExtractor = useCallback(
    (item: DeezerArtist) => String(item.id),
    [],
  );
  const albumKeyExtractor = useCallback(
    (item: DeezerAlbum) => String(item.id),
    [],
  );

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

      <View style={{ gap: 14 }}>
        <SectionHeader label={t('home.recentlyPlayed')} />
        {chartLoading ? (
          <TrackSkeletonRow count={2} />
        ) : recentTracks.length > 0 ? (
          <FlashList
            data={recentTracks}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={keyExtractor}
            renderItem={renderRecentCard}
            ItemSeparatorComponent={HorizontalSeparator}
            style={{ height: 218 }}
          />
        ) : null}
      </View>

      {(similarLoading || (similarTracks && similarTracks.length > 0)) && (
        <View style={{ gap: 14 }}>
          <SectionHeader
            label={`${t('home.becauseYouListened')} · ${similarArtist}`.toUpperCase()}
          />
          {similarLoading ? (
            <SimilarSkeletonRow count={4} />
          ) : (
            <FlashList
              data={similarTracks ?? []}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={similarKeyExtractor}
              renderItem={renderSimilarCard}
              ItemSeparatorComponent={HorizontalSeparator}
              style={{ height: 182 }}
            />
          )}
        </View>
      )}

      <View style={{ gap: 14 }}>
        <SectionHeader label={t('home.chartTracks')} />
        {chartLoading ? (
          <TrackSkeletonRow count={3} />
        ) : chartTracks.length > 0 ? (
          <FlashList
            data={chartTracks}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={keyExtractor}
            renderItem={renderChartCard}
            ItemSeparatorComponent={HorizontalSeparator}
            style={{ height: 218 }}
          />
        ) : (
          <SignInPromptCard />
        )}
      </View>

      <View style={{ gap: 14 }}>
        <SectionHeader label={t('home.topArtists')} />
        {chartLoading ? (
          <ArtistSkeletonRow count={4} />
        ) : chartArtists.length > 0 ? (
          <FlashList
            data={chartArtists}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={artistKeyExtractor}
            renderItem={renderArtistCard}
            ItemSeparatorComponent={HorizontalSeparator}
            style={{ height: 92 }}
          />
        ) : (
          <SignInPromptCard />
        )}
      </View>

      <View style={{ gap: 14 }}>
        <SectionHeader label={t('home.topAlbums')} />
        {chartLoading ? (
          <AlbumSkeletonRow count={3} />
        ) : chartAlbums.length > 0 ? (
          <FlashList
            data={chartAlbums}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={albumKeyExtractor}
            renderItem={renderAlbumCard}
            ItemSeparatorComponent={HorizontalSeparator}
            style={{ height: 150 }}
          />
        ) : (
          <SignInPromptCard />
        )}
      </View>
    </ScreenContainer>
  );
}
