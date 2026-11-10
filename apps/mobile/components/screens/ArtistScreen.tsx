import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Rise } from '@/components/motion/Rise';
import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import {
  CollapsingHeader,
  useCollapsingHeader,
} from '@/components/ui/CollapsingHeader';
import { PlayButtons } from '@/components/ui/CollectionHero';
import { CollectionSkeleton } from '@/components/ui/CollectionSkeleton';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { LoadFailed } from '@/components/ui/LoadFailed';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { COLORS } from '@/constants/colors';
import { MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useI18n } from '@/hooks/useI18n';
import {
  getArtist,
  getArtistAlbums,
  getArtistTopTracks,
} from '@/services/api/artists';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { ArtistAlbum, ArtistDetails } from '@/types/artist';
import type { Track } from '@/types/domain';

/** Height of the artist's photo, status bar included. */
const HERO = 380;

function formatFanCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return String(count);
}

type AlbumCardProps = {
  album: ArtistAlbum;
};

function AlbumCardComponent({ album }: AlbumCardProps) {
  const handlePress = useCallback(() => {
    useOverlayStore.getState().openAlbum(album.id, album.title);
  }, [album.id, album.title]);

  const year = album.releaseDate?.slice(0, 4);

  return (
    <AnimatedPressable onPress={handlePress} style={{ width: 140, gap: 8 }}>
      {album.coverUrl ? (
        <Image
          source={{ uri: album.coverUrl }}
          style={{ width: 140, height: 140, borderRadius: 12 }}
          transition={MOTION.dur.quick}
        />
      ) : (
        <View
          style={{
            width: 140,
            height: 140,
            borderRadius: 12,
            backgroundColor: COLORS.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="music-notes" size={32} color={COLORS.textMuted} />
        </View>
      )}
      <AppText
        variant="caption"
        weight="medium"
        numberOfLines={1}
        style={{ color: COLORS.textPrimary }}
      >
        {album.title}
      </AppText>
      {year ? (
        <AppText
          variant="caption"
          style={{ color: COLORS.textMuted, fontSize: 11, marginTop: -6 }}
        >
          {year}
        </AppText>
      ) : null}
    </AnimatedPressable>
  );
}

const AlbumCard = memo(AlbumCardComponent);

type Props = {
  id: string;
};

export function ArtistScreen({ id }: Props) {
  const { t, tn } = useI18n();
  const glassMode = useGlassMode();
  // Glass mode: the overlay draws the ambient glow behind this screen.
  const background = glassMode ? 'transparent' : COLORS.background;
  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const closeArtist = useOverlayStore((s) => s.closeArtist);
  const insets = useSafeAreaInsets();
  const header = useCollapsingHeader(HERO - 120);
  const fadeTo = glassMode ? 'rgba(0,0,0,0.7)' : COLORS.background;

  // biome-ignore lint/correctness/useExhaustiveDependencies: `attempt` re-runs the load on retry.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    // Top tracks and albums are extras: a failure there keeps the page.
    Promise.allSettled([
      getArtist(id),
      getArtistTopTracks(id),
      getArtistAlbums(id),
    ])
      .then(([a, t, al]) => {
        if (cancelled) return;
        if (a.status === 'rejected') {
          console.warn('[Artist] Load error:', a.reason);
          setFailed(true);
          return;
        }
        setArtist(a.value);
        setTracks(t.status === 'fulfilled' ? t.value : []);
        setAlbums(al.status === 'fulfilled' ? al.value : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const handlePlay = useCallback(
    (track: Track) => {
      setQueue(tracks);
      play(track);
    },
    [play, setQueue, tracks],
  );

  const renderTrack = useCallback<ListRenderItem<Track>>(
    ({ item, index }) => (
      <Rise
        index={index}
        after={2}
        animate={index <= MOTION.staggerCap}
        style={{ paddingHorizontal: 12, paddingTop: 8 }}
      >
        <TrackItem
          track={item}
          onPress={handlePlay}
          isActive={currentTrackId === item.id}
          showDownload
        />
      </Rise>
    ),
    [handlePlay, currentTrackId],
  );

  const keyExtractor = useCallback((item: Track) => item.id, []);

  const back = (
    <HeaderIconButton
      icon="chevron-left"
      tone="overlay"
      onPress={closeArtist}
      accessibilityLabel={t('common.back')}
    />
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: background }}>
        <CollectionSkeleton />
        <CollapsingHeader shown={header.shown} leading={back} />
      </View>
    );
  }

  if (!artist) {
    return (
      <LoadFailed
        message={t('artist.notFound')}
        onRetry={failed ? () => setAttempt((n) => n + 1) : undefined}
        onClose={closeArtist}
        background={background}
      />
    );
  }

  const facts = [
    artist.fanCount > 0
      ? t('artist.fans', { count: formatFanCount(artist.fanCount) })
      : null,
    artist.albumCount > 0 ? tn('albums', artist.albumCount) : null,
  ].filter(Boolean);

  const ListHeader = (
    <View style={{ gap: SPACING.xxl, paddingBottom: SPACING.sm }}>
      <View>
        {/* The photo runs under the status bar and melts into the page, and
            the name sits on it: no box around the picture. */}
        <View
          style={{
            width: '100%',
            height: HERO,
            overflow: 'hidden',
            // Glass mode has no flat page colour to melt into, so there the
            // photo ends in a rounded edge of its own.
            borderBottomLeftRadius: glassMode ? 28 : 0,
            borderBottomRightRadius: glassMode ? 28 : 0,
          }}
        >
          <Image
            source={{ uri: artist.pictureUrlLarge }}
            style={{ width: '100%', height: HERO }}
            contentFit="cover"
            transition={MOTION.dur.base}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,0,0,0.5)', 'transparent']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: insets.top + 64,
            }}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(0,0,0,0.55)', fadeTo]}
            locations={[0, 0.6, 1]}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: HERO * 0.6,
            }}
          />
          <Rise
            style={{
              position: 'absolute',
              left: 20,
              right: 20,
              bottom: SPACING.lg,
              gap: SPACING.xs,
            }}
          >
            <AppText
              variant="display"
              weight="bold"
              numberOfLines={2}
              style={{ fontSize: 36, lineHeight: 40 }}
            >
              {artist.name}
            </AppText>
            {facts.length > 0 ? (
              <AppText variant="label" style={{ color: COLORS.textSecondary }}>
                {facts.join('  ·  ')}
              </AppText>
            ) : null}
          </Rise>
        </View>
        {tracks.length > 0 ? (
          <Rise
            index={1}
            style={{ paddingHorizontal: 20, paddingTop: SPACING.lg }}
          >
            <PlayButtons tracks={tracks} />
          </Rise>
        ) : null}
      </View>

      {albums.length > 0 && (
        <View style={{ gap: 12 }}>
          <View style={{ paddingHorizontal: 20 }}>
            <SectionTitle title={t('artist.albums')} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}
          >
            {albums.map((al) => (
              <AlbumCard key={al.id} album={al} />
            ))}
          </ScrollView>
        </View>
      )}

      {tracks.length > 0 && (
        <View style={{ paddingHorizontal: 20 }}>
          <SectionTitle title={t('artist.topTracks')} />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: background }}
    >
      <FlashList
        data={tracks}
        keyExtractor={keyExtractor}
        renderItem={renderTrack}
        ListHeaderComponent={ListHeader}
        onScroll={header.onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <CollapsingHeader
        title={artist.name}
        shown={header.shown}
        leading={back}
      />
    </SafeAreaView>
  );
}
