import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { DownloadButton } from '@/components/DownloadButton';
import { SourceBadge } from '@/components/SourceBadge';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import type { DownloadResult } from '@/services/download/downloadService';
import { useOverlayStore } from '@/store/useOverlayStore';
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
  const isHighlighted = isSelected || isActive;

  return (
    <AnimatedPressable
      onPress={() => onPress?.(track)}
      onLongPress={() => onLongPress?.(track)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingLeft: isHighlighted ? 12 : 0,
        paddingRight: 14,
        gap: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.divider,
        backgroundColor: isSelected
          ? `${activeColor}22`
          : isActive
            ? `${activeColor}14`
            : 'transparent',
        borderRadius: isHighlighted ? 14 : 0,
        overflow: 'hidden',
      }}
    >
      {isHighlighted && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 4,
            bottom: 4,
            width: 3,
            borderRadius: 2,
            backgroundColor: isSelected ? COLORS.textPrimary : activeColor,
          }}
        />
      )}
      {selectionMode ? (
        <View
          style={{
            width: 26,
            height: 52,
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
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
          }}
        />
      ) : (
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
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
              if (track.source === 'deezer' && track.artist.id) {
                useOverlayStore.getState().openArtist(track.artist.id);
              }
            }}
            hitSlop={4}
            style={{ flexShrink: 1 }}
          >
            <AppText
              variant="caption"
              style={{
                color: COLORS.textMuted,
                fontSize: 13,
                textDecorationLine:
                  track.source === 'deezer' ? 'underline' : 'none',
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

      <AppText
        variant="caption"
        style={{ color: COLORS.textMuted, fontSize: 13 }}
      >
        {track.duration}
      </AppText>

      {showDownload ? (
        <DownloadButton track={track} size={20} onDownloaded={onDownloaded} />
      ) : null}
    </AnimatedPressable>
  );
}

export const TrackItem = memo(TrackItemComponent);
