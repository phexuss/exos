import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';
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
    <Pressable onPress={handlePress} style={{ width: 140, gap: 8 }}>
      {album.coverUrl ? (
        <Image
          source={{ uri: album.coverUrl }}
          style={{ width: 140, height: 140, borderRadius: 12 }}
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
    </Pressable>
  );
}

const AlbumCard = memo(AlbumCardComponent);

type Props = {
  id: string;
};

export function ArtistScreen({ id }: Props) {
  const { t } = useI18n();
  const [artist, setArtist] = useState<ArtistDetails | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<ArtistAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const closeArtist = useOverlayStore((s) => s.closeArtist);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([getArtist(id), getArtistTopTracks(id), getArtistAlbums(id)])
      .then(([a, t, al]) => {
        if (cancelled) return;
        setArtist(a);
        setTracks(t);
        setAlbums(al);
      })
      .catch((e) => {
        if (!cancelled && __DEV__) console.warn('[Artist] Load error:', e);
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
      setQueue(tracks);
      play(track);
    },
    [play, setQueue, tracks],
  );

  const renderTrack = useCallback<ListRenderItem<Track>>(
    ({ item }) => (
      <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
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

  if (!artist) {
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
          {t('artist.notFound')}
        </AppText>
      </SafeAreaView>
    );
  }

  const ListHeader = (
    <View style={{ gap: 24 }}>
      {}
      <View style={{ alignItems: 'center', gap: 16 }}>
        <View style={{ position: 'relative', width: '100%', height: 260 }}>
          <Image
            source={{ uri: artist.pictureUrlLarge }}
            style={{
              width: '100%',
              height: 260,
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
            }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', COLORS.background]}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 100,
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
            }}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,0,0,0.55)', 'transparent']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: insets.top + 64,
            }}
          />
          <HeaderIconButton
            icon="chevron-left"
            tone="overlay"
            onPress={closeArtist}
            accessibilityLabel={t('common.back')}
            style={{
              position: 'absolute',
              top: insets.top + (LAYOUT.headerHeight - LAYOUT.iconButton) / 2,
              left: LAYOUT.gutter,
            }}
          />
        </View>

        <View style={{ alignItems: 'center', gap: 6, marginTop: -40 }}>
          <AppText
            variant="display"
            weight="bold"
            style={{ color: COLORS.textPrimary, fontSize: 26 }}
          >
            {artist.name}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {artist.fanCount > 0 && (
              <AppText variant="caption" style={{ color: COLORS.textMuted }}>
                {t('artist.fans', { count: formatFanCount(artist.fanCount) })}
              </AppText>
            )}
            {artist.albumCount > 0 && (
              <AppText variant="caption" style={{ color: COLORS.textMuted }}>
                {artist.albumCount} albums
              </AppText>
            )}
          </View>
        </View>
      </View>

      {}
      {albums.length > 0 && (
        <View style={{ gap: 12 }}>
          <AppText
            variant="label"
            weight="medium"
            style={{
              color: COLORS.textSecondary,
              letterSpacing: 1,
              fontSize: 12,
              paddingHorizontal: 16,
            }}
          >
            {t('artist.albums').toUpperCase()}
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
          >
            {albums.map((al) => (
              <AlbumCard key={al.id} album={al} />
            ))}
          </ScrollView>
        </View>
      )}

      {}
      {tracks.length > 0 && (
        <AppText
          variant="label"
          weight="medium"
          style={{
            color: COLORS.textSecondary,
            letterSpacing: 1,
            fontSize: 12,
            paddingHorizontal: 16,
          }}
        >
          {t('artist.topTracks').toUpperCase()}
        </AppText>
      )}
    </View>
  );

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <FlashList
        data={tracks}
        keyExtractor={keyExtractor}
        renderItem={renderTrack}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
}
