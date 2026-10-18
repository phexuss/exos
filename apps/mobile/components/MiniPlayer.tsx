import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { SourceBadge } from '@/components/SourceBadge';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { GLASS, GLASS_SPRING } from '@/constants/glass';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';

type MiniPlayerProps = {
  /** Glass mode only: native backdrop blur. Off while an overlay covers it. */
  blur?: boolean;
};

// Progress is polled every 250 ms; easing each step keeps the bar animating
// nonstop during playback, which on Android makes every native blur on screen
// re-render each frame. In Glass mode there it jumps per poll instead.
const ANIMATE_PROGRESS = Platform.OS !== 'android';

type MiniPlayerProgressProps = {
  glassMode: boolean;
  accentColor: string;
};

/**
 * Follows playback position on its own, so the 250 ms progress ticks
 * re-render this bar and not the artwork, text and glass around it.
 */
function MiniPlayerProgress({
  glassMode,
  accentColor,
}: MiniPlayerProgressProps) {
  const progress = usePlayerStore((s) => s.progress);
  const progressWidth = useSharedValue(Math.max(progress * 100, 0.5));

  useEffect(() => {
    const width = Math.max(progress * 100, 0.5);
    if (glassMode && !ANIMATE_PROGRESS) {
      progressWidth.set(width);
      return;
    }
    progressWidth.set(
      withTiming(width, {
        duration: 250,
        easing: Easing.linear,
      }),
    );
  }, [progress, progressWidth, glassMode]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.get()}%`,
  }));

  return (
    <View
      style={
        glassMode
          ? {
              position: 'absolute',
              left: 22,
              right: 22,
              bottom: 0,
              height: 2,
              borderRadius: 1,
              backgroundColor: GLASS.rim,
              overflow: 'hidden',
            }
          : { height: 1, backgroundColor: COLORS.divider }
      }
    >
      <Animated.View
        style={[
          { height: glassMode ? 2 : 1, backgroundColor: accentColor },
          progressStyle,
        ]}
      />
    </View>
  );
}

export function MiniPlayer({ blur = true }: MiniPlayerProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlayback = usePlayerStore((s) => s.togglePlayback);
  const accentColor = useDynamicAccent();
  const glassMode = useGlassMode();

  if (!currentTrack) return null;

  const progressBar = (
    <MiniPlayerProgress glassMode={glassMode} accentColor={accentColor} />
  );

  const row = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: glassMode ? 10 : 16,
        paddingVertical: glassMode ? 9 : 10,
        gap: 12,
      }}
    >
      {currentTrack.coverUrl ? (
        <Image
          source={{ uri: currentTrack.coverUrl }}
          style={{
            width: glassMode ? 42 : 36,
            height: glassMode ? 42 : 36,
            borderRadius: glassMode ? 12 : 6,
          }}
        />
      ) : (
        <View
          style={{
            width: glassMode ? 42 : 36,
            height: glassMode ? 42 : 36,
            borderRadius: glassMode ? 12 : 6,
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
              if (currentTrack.source === 'deezer' && currentTrack.artist.id) {
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
        {glassMode ? (
          <Animated.View
            key={isPlaying ? 'pause' : 'play'}
            entering={ZoomIn.springify()
              .damping(GLASS_SPRING.snappy.damping)
              .stiffness(GLASS_SPRING.snappy.stiffness)}
          >
            <AppIcon
              name={isPlaying ? 'pause' : 'play'}
              size={22}
              color={COLORS.textPrimary}
            />
          </Animated.View>
        ) : (
          <AppIcon
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color={COLORS.textPrimary}
          />
        )}
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
  );

  const openPlayer = () => usePlayerStore.getState().openPlayer();

  if (glassMode) {
    return (
      <Animated.View
        entering={FadeInDown.springify()
          .damping(GLASS_SPRING.smooth.damping)
          .stiffness(GLASS_SPRING.smooth.stiffness)
          .mass(GLASS_SPRING.smooth.mass)}
        exiting={FadeOutDown.duration(200)}
        style={{ marginHorizontal: 12, marginBottom: 8 }}
      >
        <AnimatedPressable scaleValue={0.96} onPress={openPlayer}>
          <GlassSurface
            floating
            variant="regular"
            blur={blur}
            style={{ borderRadius: GLASS.radius.card }}
          >
            {row}
            {progressBar}
          </GlassSurface>
        </AnimatedPressable>
      </Animated.View>
    );
  }

  return (
    <AnimatedPressable
      scaleValue={0.975}
      onPress={openPlayer}
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
      {progressBar}
      {row}
    </AnimatedPressable>
  );
}
