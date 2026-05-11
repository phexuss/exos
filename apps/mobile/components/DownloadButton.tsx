import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppDialog } from '@/components/AppDialog';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { useI18n } from '@/hooks/useI18n';
import { ApiError } from '@/services/api/client';
import {
  type DownloadResult,
  downloadTrack,
} from '@/services/download/downloadService';
import { useDownloadStore } from '@/store/useDownloadStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

type Props = {
  track: Track;
  size?: number;
  onDownloaded?: (track: Track, download: DownloadResult) => void;
};

export function DownloadButton({ track, size = 20, onDownloaded }: Props) {
  const { t } = useI18n();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isDownloaded = useDownloadStore((s) => s.downloadedIds.has(track.id));
  const markTrackDownloaded = usePlayerStore((s) => s.markTrackDownloaded);

  const dlProgress = useDownloadStore(
    (s) => s.activeDownloads[track.id]?.progress ?? -1,
  );
  const dlStatus = useDownloadStore((s) => s.activeDownloads[track.id]?.status);

  const isLoading =
    dlStatus != null && dlStatus !== 'done' && dlStatus !== 'error';
  const progress = dlProgress === -1 ? 0 : dlProgress;
  const status: 'idle' | 'loading' | 'done' =
    isDownloaded || track.isDownloaded
      ? 'done'
      : isLoading
        ? 'loading'
        : 'idle';

  const handlePress = useCallback(async () => {
    if (status !== 'idle') return;
    try {
      const download = await downloadTrack(track);
      markTrackDownloaded(track.id, download);
      onDownloaded?.(track, download);
    } catch (e) {
      const message =
        e instanceof ApiError && e.status === 503
          ? t('common.downloadBusy')
          : e instanceof ApiError && e.status === 429
            ? t('common.tooManyRequests')
            : e instanceof Error
              ? e.message
              : t('common.error');
      console.warn('[Download]', e);
      setErrorMessage(message);
    }
  }, [track, status, markTrackDownloaded, onDownloaded, t]);

  const indicatorSize = size + 4;

  return (
    <>
      <Pressable
        onPress={handlePress}
        hitSlop={10}
        style={{
          width: size + 16,
          height: size + 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {status === 'loading' ? (
          <View style={{ width: indicatorSize, height: indicatorSize }}>
            <View
              style={{
                position: 'absolute',
                width: indicatorSize,
                height: indicatorSize,
                borderRadius: indicatorSize / 2,
                borderWidth: 2,
                borderColor: COLORS.border,
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: indicatorSize,
                height: indicatorSize,
                borderRadius: indicatorSize / 2,
                borderWidth: 2,
                borderColor: COLORS.accent,
                borderTopColor: progress > 0.99 ? COLORS.accent : 'transparent',
                borderRightColor:
                  progress > 0.25 ? COLORS.accent : 'transparent',
                borderBottomColor:
                  progress > 0.5 ? COLORS.accent : 'transparent',
                borderLeftColor:
                  progress > 0.75 ? COLORS.accent : 'transparent',
                transform: [{ rotate: '-90deg' }],
              }}
            />
            <AppText
              variant="caption"
              style={{
                position: 'absolute',
                width: indicatorSize,
                height: indicatorSize,
                textAlign: 'center',
                lineHeight: indicatorSize,
                fontSize: 8,
                color: COLORS.textMuted,
              }}
            >
              {Math.round(progress * 100)}
            </AppText>
          </View>
        ) : (
          <AppIcon
            name={status === 'done' ? 'check' : 'download'}
            size={size}
            color={status === 'done' ? COLORS.accent : COLORS.textMuted}
          />
        )}
      </Pressable>

      <AppDialog
        visible={!!errorMessage}
        title={t('common.error')}
        message={errorMessage}
        confirmLabel={t('common.close')}
        showCancel={false}
        onConfirm={() => setErrorMessage(null)}
        onClose={() => setErrorMessage(null)}
      />
    </>
  );
}
