import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';

import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { COLORS } from '@/constants/colors';
import { useI18n } from '@/hooks/useI18n';
import { getDownloadedTracks, getPlaylists, type PlaylistRow } from '@/services/db/database';
import { useDownloadStore } from '@/store/useDownloadStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

export default function LibraryScreen() {
  const { t } = useI18n();
  const { play, setQueue } = usePlayerStore();
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

  const handlePlay = (track: Track) => {
    play(track);
    setQueue(tracks);
    router.push('/player' as const);
  };

  return (
    <ScreenContainer>
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
            style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
          >
            {playlists.map((pl) => (
              <Pressable
                key={pl.id}
                onPress={() => router.push(`/playlist/${pl.id}`)}
                style={{
                  width: 120,
                  gap: 8,
                }}
              >
                {pl.cover_url ? (
                  <Image
                    source={{ uri: pl.cover_url }}
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
                  {pl.name}
                </AppText>
                <AppText
                  variant="caption"
                  style={{ color: COLORS.textMuted, fontSize: 11, marginTop: -6 }}
                >
                  {pl.track_count} tracks
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={{ gap: 12 }}>
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
        {tracks.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
            <AppIcon name="download" size={28} color={COLORS.textMuted} />
            <AppText variant="caption" style={{ color: COLORS.textMuted }}>
              No downloads yet
            </AppText>
          </View>
        ) : (
          <View
            style={{
              borderTopWidth: 0.5,
              borderTopColor: COLORS.border,
            }}
          >
            {tracks.map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                onPress={handlePlay}
                onLongPress={setSelectedTrack}
              />
            ))}
          </View>
        )}
      </View>

      <TrackActionsSheet
        track={selectedTrack}
        visible={!!selectedTrack}
        onClose={() => setSelectedTrack(null)}
        onDeleted={load}
      />
    </ScreenContainer>
  );
}
