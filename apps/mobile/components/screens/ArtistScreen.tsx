import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Rise } from '@/components/motion/Rise';
import { SourceBadge } from '@/components/SourceBadge';
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
import { Skeleton } from '@/components/ui/Skeleton';

import { COLORS } from '@/constants/colors';
import { MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useI18n } from '@/hooks/useI18n';
import {
  getArtist,
  getArtistAlbums,
  getArtistTopTracks,
  getArtistUploads,
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

/** Popular tracks shown before "Show all" on a SoundCloud page. */
const POPULAR_PREVIEW = 5;

/** One line of the page under the photo: a heading, a track, or a placeholder. */
type Row =
  | {
      kind: 'title';
      key: string;
      title: string;
      count?: number;
      action?: { label: string; onPress: () => void };
    }
  | { kind: 'track'; key: string; track: Track; queue: Track[]; index: number }
  | { kind: 'loading'; key: string };

function LoadingRows() {
  return (
    <View style={{ gap: SPACING.lg, paddingHorizontal: 20, paddingTop: 8 }}>
      {(['62%', '48%', '70%'] as const).map((width) => (
        <View
          key={width}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.md,
          }}
        >
          <Skeleton width={48} height={48} radius={8} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width={width} height={12} radius={4} />
            <Skeleton width="34%" height={10} radius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

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
  // SoundCloud only: every upload, which can take a few pages to fetch, so
  // it fills in after the page is up.
  const [uploads, setUploads] = useState<Track[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);
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
    setUploads([]);
    setShowAllPopular(false);
    setUploadsLoading(true);
    getArtistUploads(id)
      .then((list) => {
        if (!cancelled) setUploads(list);
      })
      .catch((e) => console.warn('[Artist] Uploads error:', e))
      .finally(() => {
        if (!cancelled) setUploadsLoading(false);
      });

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

  const isSoundCloud = artist?.source === 'soundcloud';

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    const popular =
      isSoundCloud && !showAllPopular
        ? tracks.slice(0, POPULAR_PREVIEW)
        : tracks;
    if (tracks.length > 0) {
      out.push({
        kind: 'title',
        key: 'title:top',
        title: t('artist.topTracks'),
        action:
          isSoundCloud && tracks.length > POPULAR_PREVIEW
            ? {
                label: t(showAllPopular ? 'artist.showLess' : 'artist.showAll'),
                onPress: () => setShowAllPopular((v) => !v),
              }
            : undefined,
      });
      popular.forEach((track, index) => {
        out.push({
          kind: 'track',
          key: `top:${track.id}`,
          track,
          queue: tracks,
          index,
        });
      });
    }
    if (isSoundCloud && (uploadsLoading || uploads.length > 0)) {
      out.push({
        kind: 'title',
        key: 'title:uploads',
        title: t('artist.uploads'),
        count: uploadsLoading ? undefined : uploads.length,
      });
      if (uploadsLoading) out.push({ kind: 'loading', key: 'loading' });
      uploads.forEach((track, index) => {
        out.push({
          kind: 'track',
          key: `up:${track.id}`,
          track,
          queue: uploads,
          index,
        });
      });
    }
    return out;
  }, [t, isSoundCloud, tracks, uploads, uploadsLoading, showAllPopular]);

  const renderRow = useCallback<ListRenderItem<Row>>(
    ({ item }) => {
      if (item.kind === 'title') {
        return (
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: item.key === 'title:top' ? 0 : SPACING.xxl,
              paddingBottom: SPACING.xs,
            }}
          >
            <SectionTitle
              title={item.title}
              count={item.count}
              action={item.action}
            />
          </View>
        );
      }
      if (item.kind === 'loading') return <LoadingRows />;
      const { track, queue, index } = item;
      return (
        <Rise
          index={index}
          after={2}
          animate={index <= MOTION.staggerCap}
          style={{ paddingHorizontal: 12, paddingTop: 8 }}
        >
          <TrackItem
            track={track}
            onPress={(picked) => {
              setQueue(queue);
              play(picked);
            }}
            isActive={currentTrackId === track.id}
            showDownload
          />
        </Rise>
      );
    },
    [play, setQueue, currentTrackId],
  );

  const keyExtractor = useCallback((item: Row) => item.key, []);
  const getItemType = useCallback((item: Row) => item.kind, []);

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
      ? t(isSoundCloud ? 'artist.followers' : 'artist.fans', {
          count: formatFanCount(artist.fanCount),
        })
      : null,
    artist.albumCount > 0 ? tn('albums', artist.albumCount) : null,
    artist.trackCount ? tn('tracks', artist.trackCount) : null,
  ].filter(Boolean);
  const playable = tracks.length > 0 ? tracks : uploads;

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
            {facts.length > 0 || isSoundCloud ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: SPACING.sm,
                }}
              >
                {isSoundCloud ? <SourceBadge source="soundcloud" /> : null}
                {facts.length > 0 ? (
                  <AppText
                    variant="label"
                    numberOfLines={1}
                    style={{ color: COLORS.textSecondary, flexShrink: 1 }}
                  >
                    {facts.join('  ·  ')}
                  </AppText>
                ) : null}
              </View>
            ) : null}
          </Rise>
        </View>
        {playable.length > 0 ? (
          <Rise
            index={1}
            style={{ paddingHorizontal: 20, paddingTop: SPACING.lg }}
          >
            <PlayButtons tracks={playable} />
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
    </View>
  );

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: background }}
    >
      <FlashList
        data={rows}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        renderItem={renderRow}
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
