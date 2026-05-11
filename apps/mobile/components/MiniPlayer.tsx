import { useEffect } from 'react';
import { Image, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { SourceBadge } from '@/components/SourceBadge';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';

export function MiniPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const togglePlayback = usePlayerStore((s) => s.togglePlayback);
  const accentColor = useDynamicAccent();
  const progressWidth = useSharedValue(Math.max(progress * 100, 0.5));

  useEffect(() => {
    progressWidth.value = withTiming(Math.max(progress * 100, 0.5), {
      duration: 250,
      easing: Easing.linear,
    });
  }, [progress, progressWidth]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (!currentTrack) return null;

  return (
    <AnimatedPressable
      scaleValue={0.975}
      onPress={() => usePlayerStore.getState().openPlayer()}
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
        <Animated.View
          style={[
            {
              height: 1,
              backgroundColor: accentColor,
            },
            progressStyle,
          ]}
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
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                if (
                  currentTrack.source === 'deezer' &&
                  currentTrack.artist.id
                ) {
                  useOverlayStore.getState().openArtist(currentTrack.artist.id);
                }
              }}
              hitSlop={4}
            >
              <AppText
                variant="caption"
                style={{
                  color: COLORS.textMuted,
                  fontSize: 11,
                  textDecorationLine:
                    currentTrack.source === 'deezer' ? 'underline' : 'none',
                }}
                numberOfLines={1}
              >
                {currentTrack.artist.name}
              </AppText>
            </Pressable>
            <SourceBadge source={currentTrack.source} />
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
