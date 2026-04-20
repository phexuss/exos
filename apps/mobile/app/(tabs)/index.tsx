import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, View } from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SourceBadge } from '@/components/SourceBadge';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { COLORS } from '@/constants/colors';
import { useI18n } from '@/hooks/useI18n';
import { getRecentlyPlayed } from '@/services/db/database';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

function RecentCard({ track, onPress }: { track: Track; onPress: () => void }) {
  return (
    <AnimatedPressable
      scaleValue={0.95}
      onPress={onPress}
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
          style={{ color: COLORS.textPrimary, fontSize: 14 }}
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

export default function HomeScreen() {
  const { t } = useI18n();
  const { play, setQueue } = usePlayerStore();
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

  const handlePlay = (track: Track) => {
    setQueue(recentTracks);
    play(track);
    router.push('/player' as const);
  };

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
          onPress={() => router.push('/settings' as const)}
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
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 14 }}
            renderItem={({ item }) => (
              <RecentCard track={item} onPress={() => handlePlay(item)} />
            )}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
