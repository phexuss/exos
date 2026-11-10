import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { DownloadButton } from '@/components/DownloadButton';
import { EqBars } from '@/components/EqBars';
import { SourceBadge } from '@/components/SourceBadge';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { artistPageId } from '@/services/artistPage';
import type { DownloadResult } from '@/services/download/downloadService';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

type TrackItemProps = {
  track: Track;
  onPress?: (track: Track) => void;
  onLongPress?: (track: Track) => void;
  onDownloaded?: (track: Track, download: DownloadResult) => void;
  showBitrate?: boolean;
  showDownload?: boolean;
  isActive?: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
  accentColor?: string;
};

function TrackItemComponent({
  track,
  onPress,
  onLongPress,
  onDownloaded,
  showBitrate,
  showDownload,
  isActive,
  isSelected,
  selectionMode,
  accentColor,
}: TrackItemProps) {
  const activeColor = accentColor ?? COLORS.accent;
  const isPlaying = usePlayerStore((s) => !!isActive && s.isPlaying);

  return (
    <AnimatedPressable
      scaleValue={MOTION.rowPressScale}
      highlightRadius={14}
      onPress={() => onPress?.(track)}
      onLongPress={() => onLongPress?.(track)}
      // Desktop track-table row: rounded, no dividers, the playing row sits
      // on a lighter fill with a glass rim. Inset by its own padding so the
      // cover still lines up with the page gutter.
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: -SPACING.sm,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        gap: SPACING.md,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: isActive || isSelected ? GLASS.rim : 'transparent',
        backgroundColor: isSelected
          ? `${activeColor}22`
          : isActive
            ? GLASS.fillActive
            : 'transparent',
      }}
    >
      {selectionMode ? (
        <View
          style={{
            width: 26,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isSelected ? (
            <AppIcon name="check" size={22} color={activeColor} />
          ) : (
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: 1.5,
                borderColor: COLORS.textMuted,
              }}
            />
          )}
        </View>
      ) : null}
      {track.coverUrl ? (
        <Image
          source={{ uri: track.coverUrl }}
          recyclingKey={track.id}
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
          }}
          transition={MOTION.dur.quick}
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: COLORS.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}
        >
          <AppText
            variant="body"
            weight="bold"
            style={{ color: COLORS.textMuted }}
          >
            {track.artist.name.charAt(0)}
          </AppText>
        </View>
      )}

      <View style={{ flex: 1, gap: 3 }}>
        <AppText
          variant="body"
          weight="medium"
          style={{
            color: isActive ? activeColor : COLORS.textPrimary,
            fontSize: 15,
          }}
          numberOfLines={1}
        >
          {track.title}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable
            onPress={() => {
              const page = artistPageId(track);
              if (page) useOverlayStore.getState().openArtist(page);
            }}
            hitSlop={4}
            style={{ flexShrink: 1 }}
          >
            <AppText
              variant="caption"
              style={{
                color: COLORS.textMuted,
                fontSize: 13,
              }}
              numberOfLines={1}
            >
              {track.artist.name}
            </AppText>
          </Pressable>
          <SourceBadge source={track.source} />
          {showBitrate && track.bitrate ? (
            <AppText
              variant="caption"
              weight="medium"
              style={{
                fontSize: 10,
                letterSpacing: 0.5,
                color:
                  track.bitrate === 'FLAC' ? COLORS.accent : COLORS.textMuted,
              }}
            >
              {track.bitrate}
            </AppText>
          ) : null}
        </View>
      </View>

      {isActive ? (
        <EqBars color={activeColor} playing={isPlaying} />
      ) : (
        <AppText
          variant="caption"
          style={{ color: COLORS.textMuted, fontSize: 13 }}
        >
          {track.duration}
        </AppText>
      )}

      {showDownload ? (
        <DownloadButton track={track} size={20} onDownloaded={onDownloaded} />
      ) : null}
    </AnimatedPressable>
  );
}

export const TrackItem = memo(TrackItemComponent);
