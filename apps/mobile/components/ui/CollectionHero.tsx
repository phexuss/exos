import { Image } from 'expo-image';
import { View } from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Rise } from '@/components/motion/Rise';
import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

const COVER = 216;
const BUTTON_HEIGHT = 48;

/** Starts `tracks` from the top, or from a random one with shuffle on. */
export function playCollection(tracks: Track[], shuffled: boolean): void {
  if (tracks.length === 0) return;
  const player = usePlayerStore.getState();
  usePlayerStore.setState({ shuffle: shuffled });
  player.setQueue(tracks);
  player.play(
    shuffled ? tracks[Math.floor(Math.random() * tracks.length)] : tracks[0],
  );
}

type PlayButtonsProps = {
  tracks: Track[];
};

/**
 * Play and Shuffle side by side: the first thing under the heading of any
 * collection (playlist, album, artist).
 */
export function PlayButtons({ tracks }: PlayButtonsProps) {
  const { t } = useI18n();
  const disabled = tracks.length === 0;
  const box = {
    flex: 1,
    height: BUTTON_HEIGHT,
    borderRadius: GLASS.radius.capsule,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: SPACING.sm,
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <View style={{ flexDirection: 'row', gap: SPACING.md }}>
      <AnimatedPressable
        scaleValue={0.96}
        haptic="tap"
        disabled={disabled}
        onPress={() => playCollection(tracks, false)}
        accessibilityRole="button"
        style={[box, { backgroundColor: COLORS.textPrimary }]}
      >
        <AppIcon name="play-solid" size={18} color={COLORS.background} />
        <AppText
          variant="body"
          weight="bold"
          numberOfLines={1}
          style={{ color: COLORS.background, fontSize: 15 }}
        >
          {t('player.play')}
        </AppText>
      </AnimatedPressable>
      <AnimatedPressable
        scaleValue={0.96}
        haptic="tap"
        disabled={disabled}
        onPress={() => playCollection(tracks, true)}
        accessibilityRole="button"
        style={[
          box,
          {
            backgroundColor: COLORS.fill2,
            borderWidth: 1,
            borderColor: GLASS.rim,
          },
        ]}
      >
        <AppIcon name="shuffle" size={18} color={COLORS.textPrimary} />
        <AppText
          variant="body"
          weight="bold"
          numberOfLines={1}
          style={{ fontSize: 15 }}
        >
          {t('player.shuffle')}
        </AppText>
      </AnimatedPressable>
    </View>
  );
}

type CollectionHeroProps = {
  coverUrl?: string | null;
  /** Shown on the tile when there is no cover. */
  icon: IconName;
  title: string;
  /** Second line, e.g. the artist. */
  subtitle?: string;
  /** Third, quiet line, e.g. the track count. */
  detail?: string;
  tracks: Track[];
};

/**
 * The top of a playlist or an album: the cover floating on a shadow, the
 * name large under it, then Play and Shuffle. Each part rises in turn.
 */
export function CollectionHero({
  coverUrl,
  icon,
  title,
  subtitle,
  detail,
  tracks,
}: CollectionHeroProps) {
  return (
    <View style={{ gap: SPACING.xl, paddingBottom: SPACING.lg }}>
      <Rise style={{ alignItems: 'center' }}>
        <View
          style={{
            width: COVER,
            height: COVER,
            borderRadius: SPACING.lg,
            backgroundColor: COLORS.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: [
              {
                offsetX: 0,
                offsetY: 16,
                blurRadius: 32,
                spreadDistance: -6,
                color: 'rgba(0,0,0,0.5)',
              },
            ],
          }}
        >
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={{
                width: COVER,
                height: COVER,
                borderRadius: SPACING.lg,
              }}
              contentFit="cover"
              transition={MOTION.dur.quick}
            />
          ) : (
            <AppIcon name={icon} size={56} color={COLORS.textMuted} />
          )}
        </View>
      </Rise>

      <Rise index={1} style={{ alignItems: 'center', gap: SPACING.xs }}>
        <AppText
          variant="display"
          weight="bold"
          numberOfLines={2}
          style={{ fontSize: 26, lineHeight: 32, textAlign: 'center' }}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            variant="body"
            numberOfLines={1}
            style={{ color: COLORS.textSecondary }}
          >
            {subtitle}
          </AppText>
        ) : null}
        {detail ? (
          <AppText variant="label" style={{ color: COLORS.textMuted }}>
            {detail}
          </AppText>
        ) : null}
      </Rise>

      <Rise index={2}>
        <PlayButtons tracks={tracks} />
      </Rise>
    </View>
  );
}
