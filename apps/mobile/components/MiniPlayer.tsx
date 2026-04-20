import { router } from 'expo-router';
import { Image, Pressable, View } from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { SourceBadge } from '@/components/SourceBadge';
import { COLORS } from '@/constants/colors';
import { usePlayerStore } from '@/store/usePlayerStore';

export function MiniPlayer() {
  const { currentTrack, isPlaying, isPreview, progress, togglePlayback } =
    usePlayerStore();

  if (!currentTrack) return null;

  return (
    <AnimatedPressable
      scaleValue={0.975}
      onPress={() => router.push('/player' as const)}
      style={{
        backgroundColor: COLORS.surfaceElevated,
        marginHorizontal: 8,
        marginBottom: 6,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: 1,
          backgroundColor: COLORS.divider,
        }}
      >
        <View
          style={{
            height: 1,
            width: `${Math.max(progress * 100, 0.5)}%`,
            backgroundColor: COLORS.accent,
          }}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          gap: 12,
        }}
      >
        {currentTrack.coverUrl ? (
          <Image
            source={{ uri: currentTrack.coverUrl }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
            }}
          />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              backgroundColor: COLORS.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 0.5,
              borderColor: COLORS.border,
            }}
          >
            <AppIcon name="music" size={14} color={COLORS.textMuted} />
          </View>
        )}

        <View style={{ flex: 1, gap: 1 }}>
          <AppText
            variant="caption"
            weight="medium"
            style={{ color: COLORS.textPrimary, fontSize: 13 }}
            numberOfLines={1}
          >
            {currentTrack.title}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText
              variant="caption"
              style={{ color: COLORS.textMuted, fontSize: 11 }}
              numberOfLines={1}
            >
              {currentTrack.artist.name}
            </AppText>
            <SourceBadge source={currentTrack.source} />
            {isPreview ? (
              <View
                style={{
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 3,
                  backgroundColor: 'rgba(251, 191, 36, 0.15)',
                }}
              >
                <AppText
                  variant="caption"
                  weight="medium"
                  style={{ color: '#FBBF24', fontSize: 8, letterSpacing: 0.5 }}
                >
                  PREVIEW
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            togglePlayback();
          }}
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color={COLORS.textPrimary}
          />
        </Pressable>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            usePlayerStore.getState().skipNext();
          }}
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="next" size={20} color={COLORS.textMuted} />
        </Pressable>
      </View>
    </AnimatedPressable>
  );
}
