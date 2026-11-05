import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { AnimatedModal } from '@/components/AnimatedModal';
import { GlassIconButton } from '@/components/glass/GlassIconButton';
import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { PillButton } from '@/components/ui/PillButton';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';
import {
  cloudTrackToTrack,
  getAllCloudDownloads,
} from '@/services/api/library';
import {
  restorePlaylistsFromCloud,
  syncLocalLibraryNow,
} from '@/services/sync/librarySyncService';
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
      // Playlists first, so tracks downloaded from this list land in them.
      await restorePlaylistsFromCloud().catch((e) =>
        console.warn('[RestoreLibrary] Playlists skipped:', e),
      );
      await syncLocalLibraryNow();
      const cloudTracks = await getAllCloudDownloads();
      setTracks(cloudTracks.map(cloudTrackToTrack));
    } catch (e) {
      console.warn('[RestoreLibrary] Load failed:', e);
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
        borderRadius: GLASS.radius.dialog,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: GLASS.rim,
        padding: SPACING.xl,
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
        <GlassIconButton
          icon="close"
          onPress={onClose}
          size={36}
          iconColor={COLORS.textSecondary}
          accessibilityLabel={t('common.close')}
        />
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
          <PillButton
            label={t('common.retry')}
            tone="accent"
            fill={false}
            onPress={load}
          />
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
