import { Image, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { SourcePill } from '@/components/ui/SourcePill';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import type { Track } from '@/types/domain';

type RecentlyPlayedCardProps = {
  track: Track;
};

export function RecentlyPlayedCard({ track }: RecentlyPlayedCardProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        padding: SPACING.md,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      {track.coverUrl ? (
        <Image
          source={{ uri: track.coverUrl }}
          style={{ width: 56, height: 56, borderRadius: 12 }}
        />
      ) : (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: COLORS.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="play" size={24} color={COLORS.textSecondary} />
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="label" weight="bold">
          {track.title}
        </AppText>
        <AppText variant="caption" style={{ color: COLORS.textSecondary }}>
          {track.artist.name} · {track.duration}
        </AppText>
        <SourcePill source={track.source} />
      </View>
      <AppIcon
        name="heart"
        size={18}
        color={track.liked ? COLORS.accent : COLORS.textMuted}
      />
    </View>
  );
}
