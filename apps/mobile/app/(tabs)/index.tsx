import { memo, useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  type ListRenderItem,
  Pressable,
  View,
} from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SourceBadge } from '@/components/SourceBadge';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { COLORS } from '@/constants/colors';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useI18n } from '@/hooks/useI18n';
import { getRecentlyPlayed } from '@/services/db/database';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

type RecentCardProps = {
  track: Track;
  onPress: (track: Track) => void;
  isActive?: boolean;
  accentColor?: string;
};

function RecentCardComponent({
  track,
  onPress,
  isActive,
  accentColor,
}: RecentCardProps) {
  const handlePress = useCallback(() => onPress(track), [onPress, track]);
  const activeColor = accentColor ?? COLORS.accent;
  return (
    <AnimatedPressable
      scaleValue={0.95}
      onPress={handlePress}
      style={{
        width: 160,
        gap: 10,
      }}
    >
      {track.coverUrl ? (
        <Image
          source={{ uri: track.coverUrl }}
          style={{
            width: 160,
            height: 160,
            borderRadius: 14,
            borderWidth: isActive ? 2 : 0,
            borderColor: isActive ? activeColor : 'transparent',
          }}
        />
      ) : (
        <View
          style={{
            width: 160,
            height: 160,
            borderRadius: 14,
            backgroundColor: COLORS.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}
        >
          <AppIcon name="music" size={32} color={COLORS.textMuted} />
        </View>
      )}
      <View style={{ gap: 3 }}>
        <AppText
          variant="body"
          weight="medium"
          style={{
            color: isActive ? activeColor : COLORS.textPrimary,
            fontSize: 14,
          }}
          numberOfLines={1}
        >
          {track.title}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <AppText
            variant="caption"
            style={{ color: COLORS.textMuted, fontSize: 12 }}
            numberOfLines={1}
          >
            {track.artist.name}
          </AppText>
          <SourceBadge source={track.source} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const RecentCard = memo(RecentCardComponent);

export default function HomeScreen() {
  const { t } = useI18n();
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const accentColor = useDynamicAccent();
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);

  const loadRecent = useCallback(async () => {
    try {
      const data = await getRecentlyPlayed(20);
      setRecentTracks(data);
    } catch (e) {
      console.warn('Recent fetch error:', e);
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const handlePlay = useCallback(
    (track: Track) => {
      setQueue(recentTracks);
      play(track);
    },
    [setQueue, play, recentTracks],
  );

  const renderCard = useCallback<ListRenderItem<Track>>(
    ({ item }) => (
      <RecentCard
        track={item}
        onPress={handlePlay}
        isActive={currentTrackId === item.id}
        accentColor={accentColor}
      />
    ),
    [handlePlay, currentTrackId, accentColor],
  );

  const keyExtractor = useCallback((item: Track) => item.id, []);

  return (
    <ScreenContainer>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <AppText variant="display" weight="bold" style={{ letterSpacing: 2 }}>
          EXØS
        </AppText>
        <Pressable
          onPress={() => useOverlayStore.getState().openProfile()}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: COLORS.surfaceMuted,
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}
        >
          <AppIcon name="profile" size={18} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      <View style={{ gap: 14 }}>
        <AppText
          variant="label"
          weight="medium"
          style={{
            color: COLORS.textSecondary,
            letterSpacing: 1,
            fontSize: 12,
          }}
        >
          {t('home.recentlyPlayed').toUpperCase()}
        </AppText>
        {recentTracks.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
            <AppIcon name="music" size={28} color={COLORS.textMuted} />
            <AppText variant="caption" style={{ color: COLORS.textMuted }}>
              {t('search.placeholder')}
            </AppText>
          </View>
        ) : (
          <FlatList
            data={recentTracks}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ gap: 14 }}
            renderItem={renderCard}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={5}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
