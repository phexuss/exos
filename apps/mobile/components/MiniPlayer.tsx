import { Image } from 'expo-image';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { Pop } from '@/components/motion/Pop';
import { Rise } from '@/components/motion/Rise';
import { useSwipeToSkip } from '@/components/motion/useSwipeToSkip';
import { SourceBadge } from '@/components/SourceBadge';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { DESKTOP_SPRING, MOTION } from '@/constants/motion';
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

// Without easing, Glass mode on Android also follows progress in 0.5% steps
// (a couple of pixels) so the bar, and the blur behind it, update about once
// a second instead of on every poll.
const STEPPED_PROGRESS_STEPS = 200;

/** Upward pull that opens the player on release. */
const OPEN_DISTANCE = 40;
const OPEN_VELOCITY = 500;
const ACTIVATE = 14;
/** How far the bar follows an upward pull, as a share of the finger. */
const LIFT_FOLLOW = 0.3;

const openPlayer = () => usePlayerStore.getState().openPlayer();
const skipNext = () => usePlayerStore.getState().skipNext();
const skipPrevious = () => usePlayerStore.getState().skipPrevious();

type MiniPlayerGesturesProps = {
  width: number;
  children: (swipeStyle: object) => ReactNode;
};

/**
 * Swipe the bar sideways to change track, pull it up to open the player.
 * The bar follows the finger both ways, so it feels held, not tapped.
 */
function MiniPlayerGestures({ width, children }: MiniPlayerGesturesProps) {
  const swipe = useSwipeToSkip(width, skipNext, skipPrevious);
  const [lift] = useState(() => new Animated.Value(0));

  const gesture = useMemo(() => {
    const pullUp = Gesture.Pan()
      .runOnJS(true)
      .activeOffsetY(-ACTIVATE)
      .failOffsetX([-ACTIVATE, ACTIVATE])
      .onUpdate((e) => {
        lift.setValue(Math.min(0, e.translationY) * LIFT_FOLLOW);
      })
      .onEnd((e) => {
        if (e.translationY < -OPEN_DISTANCE || e.velocityY < -OPEN_VELOCITY) {
          openPlayer();
        }
        Animated.spring(lift, {
          toValue: 0,
          ...DESKTOP_SPRING,
          useNativeDriver: true,
        }).start();
      });
    return Gesture.Race(swipe.gesture, pullUp);
  }, [swipe.gesture, lift]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={{ transform: [{ translateY: lift }] }}>
        {children(swipe.style)}
      </Animated.View>
    </GestureDetector>
  );
}

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
  const stepped = glassMode && !ANIMATE_PROGRESS;
  const progress = usePlayerStore((s) =>
    stepped
      ? Math.round(s.progress * STEPPED_PROGRESS_STEPS) / STEPPED_PROGRESS_STEPS
      : s.progress,
  );
  const [fill] = useState(() => new Animated.Value(Math.max(progress, 0.005)));

  // Native driver, not Reanimated: a Reanimated timing every 250 ms kept a
  // UI-thread animation (and on Android a shadow-tree commit per frame)
  // running for as long as music played.
  useEffect(() => {
    const ratio = Math.max(progress, 0.005);
    if (stepped) {
      fill.setValue(ratio);
      return;
    }
    const run = Animated.timing(fill, {
      toValue: ratio,
      duration: 250,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [progress, fill, stepped]);

  // A scaled full-width bar instead of an animated width: transforms skip
  // layout, a percentage width re-runs it on every frame.
  const progressStyle = { transform: [{ scaleX: fill }] };

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
          {
            width: '100%',
            height: glassMode ? 2 : 1,
            backgroundColor: accentColor,
            transformOrigin: 'left',
          },
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
  const [nowWidth, setNowWidth] = useState(0);

  if (!currentTrack) return null;

  const coverSize = glassMode ? 42 : 36;
  const coverRadius = glassMode ? 12 : 6;

  const progressBar = (
    <MiniPlayerProgress glassMode={glassMode} accentColor={accentColor} />
  );

  const row = (swipeStyle: object) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: glassMode ? 10 : 16,
        paddingVertical: glassMode ? 9 : 10,
        gap: 12,
      }}
    >
      {/* Cover and text move with a sideways swipe; the buttons stay put. */}
      <Animated.View
        onLayout={(e) => setNowWidth(e.nativeEvent.layout.width)}
        style={[
          { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
          swipeStyle,
        ]}
      >
        {currentTrack.coverUrl ? (
          <Image
            source={{ uri: currentTrack.coverUrl }}
            style={{
              width: coverSize,
              height: coverSize,
              borderRadius: coverRadius,
            }}
            transition={MOTION.dur.base}
          />
        ) : (
          <View
            style={{
              width: coverSize,
              height: coverSize,
              borderRadius: coverRadius,
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

        {/* Desktop player bar: a new track's text rises into place. */}
        <Rise key={currentTrack.id} style={{ flex: 1, gap: 1 }}>
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
              style={{ flexShrink: 1 }}
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
        </Rise>
      </Animated.View>

      <AnimatedPressable
        scaleValue={0.88}
        onPress={(e) => {
          e.stopPropagation();
          togglePlayback();
        }}
        hitSlop={12}
        accessibilityRole="button"
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          // Desktop player bar: white disc behind play/pause.
          backgroundColor: glassMode ? COLORS.textPrimary : 'transparent',
        }}
      >
        <Pop key={isPlaying ? 'pause' : 'play'}>
          <AppIcon
            name={isPlaying ? 'pause' : 'play'}
            size={glassMode ? 18 : 20}
            color={glassMode ? COLORS.background : COLORS.textPrimary}
          />
        </Pop>
      </AnimatedPressable>

      <AnimatedPressable
        scaleValue={0.85}
        onPress={(e) => {
          e.stopPropagation();
          skipNext();
        }}
        hitSlop={12}
        accessibilityRole="button"
        style={{
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppIcon name="next" size={20} color={COLORS.textMuted} />
      </AnimatedPressable>
    </View>
  );

  if (glassMode) {
    return (
      <Rise style={{ marginHorizontal: 12, marginBottom: 8 }}>
        <MiniPlayerGestures width={nowWidth}>
          {(swipeStyle) => (
            <AnimatedPressable scaleValue={0.97} onPress={openPlayer}>
              <GlassSurface
                floating
                variant="regular"
                blur={blur}
                style={{ borderRadius: GLASS.radius.card }}
              >
                {row(swipeStyle)}
                {progressBar}
              </GlassSurface>
            </AnimatedPressable>
          )}
        </MiniPlayerGestures>
      </Rise>
    );
  }

  return (
    <MiniPlayerGestures width={nowWidth}>
      {(swipeStyle) => (
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
          {row(swipeStyle)}
        </AnimatedPressable>
      )}
    </MiniPlayerGestures>
  );
}
