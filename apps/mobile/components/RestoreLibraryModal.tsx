import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';

import { AnimatedModal } from '@/components/AnimatedModal';
import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';
import { cloudTrackToTrack, getCloudDownloads } from '@/services/api/library';
import { syncLocalLibraryNow } from '@/services/sync/librarySyncService';
import type { Track } from '@/types/domain';

type RestoreLibraryModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function RestoreLibraryModal({
  visible,
  onClose,
}: RestoreLibraryModalProps) {
  const { t } = useI18n();
  const { height } = useWindowDimensions();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await syncLocalLibraryNow();
      const cloudTracks = await getCloudDownloads(500);
      setTracks(cloudTracks.map(cloudTrackToTrack));
    } catch (e) {
      if (__DEV__) console.warn('[RestoreLibrary] Load failed:', e);
      setError(t('settings.restoreLibraryError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (visible) {
      load();
    } else {
      setError(null);
    }
  }, [visible, load]);

  const renderTrack = useCallback(
    (track: Track) => <TrackItem track={track} showDownload />,
    [],
  );

  const keyExtractor = useCallback((item: Track) => item.id, []);
  const listHeight = Math.min(height * 0.54, 520);

  return (
    <AnimatedModal
      visible={visible}
      onRequestClose={onClose}
      onBackdropPress={onClose}
      backdropStyle={{ paddingHorizontal: 16 }}
      contentStyle={{
        width: '100%',
        maxHeight: '82%',
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        padding: SPACING.lg,
        gap: SPACING.md,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <AppText variant="title" weight="bold">
            {t('settings.restoreLibraryTitle')}
          </AppText>
          <AppText
            variant="caption"
            style={{ color: COLORS.textMuted, marginTop: 2 }}
          >
            {t('settings.restoreLibraryDesc')}
          </AppText>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="close" size={20} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 36, alignItems: 'center', gap: 10 }}>
          <ActivityIndicator color={COLORS.accent} />
          <AppText variant="caption" style={{ color: COLORS.textMuted }}>
            {t('common.loading')}
          </AppText>
        </View>
      ) : error ? (
        <View style={{ paddingVertical: 28, alignItems: 'center', gap: 12 }}>
          <AppText
            variant="body"
            style={{ color: COLORS.textSecondary, textAlign: 'center' }}
          >
            {error}
          </AppText>
          <Pressable
            onPress={load}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: COLORS.textPrimary,
            }}
          >
            <AppText
              variant="body"
              weight="medium"
              style={{ color: COLORS.background }}
            >
              {t('common.retry')}
            </AppText>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={{ height: listHeight }}
          showsVerticalScrollIndicator={false}
        >
          {tracks.length === 0 ? (
            <View style={{ paddingVertical: 36, alignItems: 'center', gap: 8 }}>
              <AppIcon name="library" size={28} color={COLORS.textMuted} />
              <AppText variant="body" style={{ color: COLORS.textMuted }}>
                {t('settings.restoreLibraryEmpty')}
              </AppText>
            </View>
          ) : (
            tracks.map((track) => (
              <View key={keyExtractor(track)}>{renderTrack(track)}</View>
            ))
          )}
        </ScrollView>
      )}
    </AnimatedModal>
  );
}
