import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import {
  downloadTrack,
  isDownloading,
  onDownloadProgress,
} from '@/services/download/downloadService';
import { useDownloadStore } from '@/store/useDownloadStore';
import type { Track } from '@/types/domain';

type Props = {
  track: Track;
  size?: number;
  onDownloaded?: (track: Track, filePath: string) => void;
};

export function DownloadButton({ track, size = 20, onDownloaded }: Props) {
  const isGloballyDownloaded = useDownloadStore(
    (s) => s.downloadedIds.has(track.id),
  );
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>(
    isGloballyDownloaded || track.isDownloaded ? 'done' : isDownloading(track.id) ? 'loading' : 'idle',
  );
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isGloballyDownloaded) {
      setStatus('done');
    } else if (!isDownloading(track.id)) {
      setStatus('idle');
    }
  }, [track.id, isGloballyDownloaded]);

  useEffect(() => {
    if (status === 'loading' || isDownloading(track.id)) {
      return onDownloadProgress(track.id, (s) => {
        setProgress(s.progress);
        if (s.status === 'done') setStatus('done');
        if (s.status === 'error') setStatus('idle');
      });
    }
  }, [track.id, status]);

  const handlePress = useCallback(async () => {
    if (status !== 'idle') return;
    setStatus('loading');
    try {
      const filePath = await downloadTrack(track);
      onDownloaded?.(track, filePath);
    } catch (e) {
      console.warn('[Download]', e);
      setStatus('idle');
    }
  }, [track, status, onDownloaded]);

  const indicatorSize = size + 4;

  return (
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
              borderRightColor: progress > 0.25 ? COLORS.accent : 'transparent',
              borderBottomColor: progress > 0.5 ? COLORS.accent : 'transparent',
              borderLeftColor: progress > 0.75 ? COLORS.accent : 'transparent',
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
  );
}
