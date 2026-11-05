import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Rise } from '@/components/motion/Rise';
import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Skeleton } from '@/components/ui/Skeleton';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useI18n } from '@/hooks/useI18n';
import type { TranslationPath } from '@/i18n';
import { getRecentlyPlayed } from '@/services/db/database';
import {
  type HomeFeed,
  loadHomeFeed,
  type YourArtist,
  yourArtists,
} from '@/services/home/homeFeed';
import { useAuthStore } from '@/store/useAuthStore';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { Track } from '@/types/domain';

/** How many recent plays seed the page. */
const RECENT_LIMIT = 60;
const QUICK_TILES = 6;
const SHELF_ARTISTS = 10;

function greeting(): TranslationPath {
  const h = new Date().getHours();
  if (h < 5) return 'home.night';
  if (h < 12) return 'home.morning';
  if (h < 18) return 'home.afternoon';
  return 'home.evening';
}

function Cover({
  uri,
  size,
  radius,
}: {
  uri?: string;
  size: number;
  radius: number;
}) {
  return uri ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: radius }}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: COLORS.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppIcon name="music" size={size / 3} color={COLORS.textMuted} />
    </View>
  );
}

type TileProps = {
  index: number;
  track: Track;
  isActive: boolean;
  accentColor: string;
  onPress: (track: Track) => void;
};

/** Desktop "quick" tile: a recent play as cover + title on a glass chip. */
const QuickTile = memo(function QuickTile({
  index,
  track,
  isActive,
  accentColor,
  onPress,
}: TileProps) {
  return (
    <Rise index={index} after={1} style={{ width: '48.5%' }}>
      <AnimatedPressable
        scaleValue={MOTION.rowPressScale}
        highlightRadius={12}
        onPress={() => onPress(track)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: isActive
            ? GLASS.fillActive
            : 'rgba(255,255,255,0.07)',
          borderWidth: 1,
          borderColor: isActive ? GLASS.rim : 'transparent',
        }}
      >
        <Cover uri={track.coverUrl} size={52} radius={0} />
        <View style={{ flex: 1, paddingRight: SPACING.sm }}>
          <AppText
            variant="caption"
            weight="medium"
            numberOfLines={2}
            style={{
              fontSize: 13,
              color: isActive ? accentColor : COLORS.textPrimary,
            }}
          >
            {track.title}
          </AppText>
        </View>
      </AnimatedPressable>
    </Rise>
  );
});

/** Square cover with two lines under it, for the "Like …" shelf. */
const ShelfCard = memo(function ShelfCard({
  index,
  track,
  isActive,
  accentColor,
  onPress,
}: TileProps) {
  return (
    <Rise index={index} after={2}>
      <AnimatedPressable
        scaleValue={0.97}
        onPress={() => onPress(track)}
        style={{ width: 132, gap: SPACING.sm }}
      >
        <Cover uri={track.coverUrl} size={132} radius={12} />
        <View style={{ gap: 2 }}>
          <AppText
            variant="caption"
            weight="medium"
            numberOfLines={1}
            style={{
              fontSize: 13,
              color: isActive ? accentColor : COLORS.textPrimary,
            }}
          >
            {track.title}
          </AppText>
          <AppText
            variant="caption"
            numberOfLines={1}
            style={{ color: COLORS.textMuted }}
          >
            {track.artist.name}
          </AppText>
        </View>
      </AnimatedPressable>
    </Rise>
  );
});

const ArtistTile = memo(function ArtistTile({
  index,
  artist,
}: {
  index: number;
  artist: YourArtist;
}) {
  return (
    <Rise index={index} after={2}>
      <AnimatedPressable
        scaleValue={0.97}
        onPress={() => useOverlayStore.getState().openArtist(artist.id)}
        style={{ width: 92, alignItems: 'center', gap: SPACING.sm }}
      >
        <Cover uri={artist.coverUrl} size={84} radius={42} />
        <AppText
          variant="caption"
          weight="medium"
          numberOfLines={1}
          style={{ color: COLORS.textSecondary, textAlign: 'center' }}
        >
          {artist.name}
        </AppText>
      </AnimatedPressable>
    </Rise>
  );
});

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: SPACING.md,
      }}
    >
      <AppText
        variant="title"
        weight="bold"
        numberOfLines={1}
        style={{ flexShrink: 1 }}
      >
        {title}
      </AppText>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={10}>
          <AppText
            variant="label"
            weight="medium"
            style={{ color: COLORS.textSecondary }}
          >
            {action.label}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function MixSkeleton() {
  return (
    <View style={{ gap: SPACING.md }}>
      {Array.from({ length: 6 }, (_, i) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: SPACING.md,
          }}
        >
          <Skeleton width={48} height={48} radius={8} />
          <View style={{ gap: 6 }}>
            <Skeleton width={160} height={12} radius={4} />
            <Skeleton width={100} height={10} radius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const accentColor = useDynamicAccent();
  const user = useAuthStore((s) => s.user);
  const [recent, setRecent] = useState<Track[] | null>(null);
  const [feed, setFeed] = useState<HomeFeed | null>(null);

  useEffect(() => {
    const { hasSeenFaq, setHasSeenFaq } = useSettingsStore.getState();
    if (!hasSeenFaq) {
      useOverlayStore.getState().openFaq();
      setHasSeenFaq(true);
    }
  }, []);

  // Re-read plays whenever the tab comes back, so the page follows what
  // was just played.
  useFocusEffect(
    useCallback(() => {
      getRecentlyPlayed(RECENT_LIMIT)
        .then(setRecent)
        .catch(() => setRecent([]));
    }, []),
  );

  const artists = useMemo(() => yourArtists(recent ?? []), [recent]);
  const seedKey = (recent ?? [])
    .slice(0, 3)
    .map((t) => t.id)
    .join(',');

  // Rebuilt only when the latest plays change, not on every focus.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on seedKey
  useEffect(() => {
    if (!recent || recent.length === 0) {
      setFeed(null);
      return;
    }
    let alive = true;
    loadHomeFeed(recent, artists)
      .then((next) => {
        if (alive) setFeed(next);
      })
      .catch(() => {
        if (alive) setFeed({ similar: null, mix: [] });
      });
    return () => {
      alive = false;
    };
  }, [seedKey, user]);

  const playFrom = useCallback(
    (list: Track[]) => (track: Track) => {
      setQueue(list);
      play(track);
    },
    [setQueue, play],
  );

  const quick = (recent ?? []).slice(0, QUICK_TILES);
  const hasHistory = (recent?.length ?? 0) > 0;
  const mix = feed?.mix ?? [];
  const playQuick = useMemo(() => playFrom(recent ?? []), [playFrom, recent]);
  const playMix = useMemo(() => playFrom(mix), [playFrom, mix]);
  const similarTracks = feed?.similar?.tracks ?? [];
  const playSimilar = useMemo(
    () => playFrom(similarTracks),
    [playFrom, similarTracks],
  );

  return (
    <ScreenContainer withTabBar>
      <Rise
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <AppText
          variant="display"
          weight="bold"
          numberOfLines={1}
          style={{ flexShrink: 1 }}
        >
          {t(greeting())}
          {user?.name ? `, ${user.name}` : ''}
        </AppText>
        <AnimatedPressable
          scaleValue={0.9}
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
        </AnimatedPressable>
      </Rise>

      {quick.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            rowGap: SPACING.sm,
          }}
        >
          {quick.map((track, i) => (
            <QuickTile
              key={track.id}
              index={i}
              track={track}
              isActive={currentTrackId === track.id}
              accentColor={accentColor}
              onPress={playQuick}
            />
          ))}
        </View>
      ) : null}

      {recent && !hasHistory ? (
        <View style={{ gap: SPACING.md, alignItems: 'flex-start' }}>
          <SectionTitle title={t('home.mixEmpty')} />
          <AppText variant="label" style={{ color: COLORS.textMuted }}>
            {t('home.mixEmptyHint')}
          </AppText>
          <Pressable
            onPress={() => router.push('/search' as never)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 18,
              borderRadius: 999,
              backgroundColor: COLORS.textPrimary,
            }}
          >
            <AppText
              variant="label"
              weight="bold"
              style={{ color: COLORS.background }}
            >
              {t('home.findMusic')}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {hasHistory ? (
        <View style={{ gap: SPACING.md }}>
          <SectionTitle
            title={t('home.mix')}
            action={
              mix.length > 0
                ? { label: t('home.playAll'), onPress: () => playMix(mix[0]) }
                : undefined
            }
          />
          <AppText variant="caption" style={{ color: COLORS.textMuted }}>
            {t('home.mixHint')}
          </AppText>
          {!feed ? (
            <MixSkeleton />
          ) : mix.length > 0 ? (
            <View>
              {mix.map((track, i) => (
                <Rise key={track.id} index={i} after={2}>
                  <TrackItem
                    track={track}
                    onPress={playMix}
                    isActive={currentTrackId === track.id}
                    accentColor={accentColor}
                    showDownload
                  />
                </Rise>
              ))}
            </View>
          ) : (
            <AppText variant="label" style={{ color: COLORS.textMuted }}>
              {t('home.mixEmptyHint')}
            </AppText>
          )}
        </View>
      ) : null}

      {feed?.similar ? (
        <View style={{ gap: SPACING.md }}>
          <SectionTitle
            title={t('home.similar', { title: feed.similar.seed.title })}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -SPACING.lg }}
            contentContainerStyle={{
              paddingHorizontal: SPACING.lg,
              gap: SPACING.md,
            }}
          >
            {similarTracks.map((track, i) => (
              <ShelfCard
                key={track.id}
                index={i}
                track={track}
                isActive={currentTrackId === track.id}
                accentColor={accentColor}
                onPress={playSimilar}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {artists.length > 0 ? (
        <View style={{ gap: SPACING.md }}>
          <SectionTitle title={t('home.yourArtists')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -SPACING.lg }}
            contentContainerStyle={{
              paddingHorizontal: SPACING.lg,
              gap: SPACING.md,
            }}
          >
            {artists.slice(0, SHELF_ARTISTS).map((artist, i) => (
              <ArtistTile key={artist.id} index={i} artist={artist} />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </ScreenContainer>
  );
}
