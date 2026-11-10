import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Rise } from '@/components/motion/Rise';
import { TrackItem } from '@/components/TrackItem';
import {
  CollapsingHeader,
  useCollapsingHeader,
} from '@/components/ui/CollapsingHeader';
import { CollectionHero } from '@/components/ui/CollectionHero';
import { CollectionSkeleton } from '@/components/ui/CollectionSkeleton';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { LoadFailed } from '@/components/ui/LoadFailed';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useI18n } from '@/hooks/useI18n';
import { type AlbumDetail, getAlbumDetail } from '@/services/api/albums';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

type Props = {
  id: string;
  titleHint?: string;
};

export function AlbumScreen({ id, titleHint }: Props) {
  const { t, tn } = useI18n();
  const glassMode = useGlassMode();
  // Glass mode: the overlay draws the ambient glow behind this screen.
  const background = glassMode ? 'transparent' : COLORS.background;
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const closeAlbum = useOverlayStore((s) => s.closeAlbum);
  const header = useCollapsingHeader(280);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `attempt` re-runs the load on retry.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    getAlbumDetail(id)
      .then((a) => {
        if (!cancelled) setAlbum(a);
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn('[Album] Load error:', e);
        setFailed(true);
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
      if (album) setQueue(album.tracks);
      play(track);
    },
    [play, setQueue, album],
  );

  const renderTrack = useCallback<ListRenderItem<Track>>(
    ({ item, index }) => (
      <Rise
        index={index}
        after={3}
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
      onPress={closeAlbum}
      accessibilityLabel={t('common.back')}
    />
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: background }}>
        <CollectionSkeleton />
        <CollapsingHeader
          title={titleHint}
          shown={header.shown}
          leading={back}
        />
      </View>
    );
  }

  if (!album) {
    return (
      <LoadFailed
        message={t('album.notFound')}
        onRetry={failed ? () => setAttempt((n) => n + 1) : undefined}
        onClose={closeAlbum}
        background={background}
      />
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: background }}
    >
      <FlashList
        data={album.tracks}
        keyExtractor={keyExtractor}
        renderItem={renderTrack}
        onScroll={header.onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20 }}>
            <CollectionHero
              coverUrl={album.coverUrl}
              icon="music-notes"
              title={album.title}
              subtitle={album.artistName || undefined}
              detail={tn('tracks', album.tracks.length)}
              tracks={album.tracks}
            />
          </View>
        }
        contentContainerStyle={{
          paddingTop: LAYOUT.headerHeight,
          paddingBottom: 100,
        }}
      />
      <CollapsingHeader
        title={album.title}
        shown={header.shown}
        leading={back}
      />
    </SafeAreaView>
  );
}
