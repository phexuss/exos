import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  Animated as RNAnimated,
  View,
} from 'react-native';
import { GestureDetector, type PanGesture } from 'react-native-gesture-handler';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { DownloadButton } from '@/components/DownloadButton';
import { FxSheet } from '@/components/FxSheet';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { LyricsView } from '@/components/LyricsView';
import { MarqueeText } from '@/components/motion/MarqueeText';
import { PlayRing } from '@/components/motion/PlayRing';
import { Pop } from '@/components/motion/Pop';
import { Presence } from '@/components/motion/Presence';
import { Rise } from '@/components/motion/Rise';
import { useSwipeToSkip } from '@/components/motion/useSwipeToSkip';
import { SeekBar } from '@/components/SeekBar';
import { SourceBadge } from '@/components/SourceBadge';
import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { COLORS } from '@/constants/colors';
import { GLASS, SECONDARY_BLUR } from '@/constants/glass';
import { LAYOUT } from '@/constants/layout';
import { DESKTOP_SPRING, MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useI18n } from '@/hooks/useI18n';
import { useTrackLyrics } from '@/hooks/useTrackLyrics';
import * as audio from '@/services/audio/audioService';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { Track } from '@/types/domain';

type QueueOverlayProps = {
  visible: boolean;
  glassMode: boolean;
  currentTrack: Track;
  queue: Track[];
  onClose: () => void;
  onPlay: (track: Track) => void;
};

type PlaybackProgressProps = {
  durationSec: number;
  durationLabel: string;
  isPlaying: boolean;
  accentColor: string;
  glass: boolean;
  onSeek: (value: number) => void;
};

/**
 * The only part of the player that follows playback position. Progress
 * changes every 250 ms and the scrub label on every drag frame; keeping both
 * here stops them from re-rendering the artwork, controls and glass.
 */
function PlaybackProgress({
  durationSec,
  durationLabel,
  isPlaying,
  accentColor,
  glass,
  onSeek,
}: PlaybackProgressProps) {
  const progress = usePlayerStore((s) => s.progress);
  const [scrubRatio, setScrubRatio] = useState<number | null>(null);
  const totalDurationSec = audio.getDuration() || durationSec;
  const displayedCurrentTimeSec = (scrubRatio ?? progress) * totalDurationSec;

  return (
    <View style={{ gap: 4 }}>
      <SeekBar
        progress={progress}
        isPlaying={isPlaying}
        onSeek={onSeek}
        onSeekStart={audio.startSeeking}
        onSeekEnd={audio.stopSeeking}
        onScrub={setScrubRatio}
        accentColor={accentColor}
        glass={glass}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <AppText
          variant="caption"
          style={{ color: COLORS.textMuted, fontSize: 10 }}
        >
          {formatTime(displayedCurrentTimeSec)}
        </AppText>
        <AppText
          variant="caption"
          style={{ color: COLORS.textMuted, fontSize: 10 }}
        >
          {durationLabel}
        </AppText>
      </View>
    </View>
  );
}

type SwipeArtworkProps = {
  coverUrl?: string;
  radius: number;
};

/** The big cover: swipe it left for the next track, right for the previous. */
function SwipeArtwork({ coverUrl, radius }: SwipeArtworkProps) {
  const [width, setWidth] = useState(0);
  const skipNext = usePlayerStore((s) => s.skipNext);
  const skipPrevious = usePlayerStore((s) => s.skipPrevious);
  const swipe = useSwipeToSkip(width, skipNext, skipPrevious);

  return (
    <GestureDetector gesture={swipe.gesture}>
      <RNAnimated.View
        style={[{ flex: 1 }, swipe.style]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={{ flex: 1, borderRadius: radius }}
            contentFit="cover"
            transition={MOTION.dur.base}
          />
        ) : (
          <Skeleton width="100%" height="100%" radius={radius} />
        )}
      </RNAnimated.View>
    </GestureDetector>
  );
}

function QueueOverlay({
  visible,
  glassMode,
  currentTrack,
  queue,
  onClose,
  onPlay,
}: QueueOverlayProps) {
  const { t } = useI18n();
  // The overlay is absolutely positioned, so it ignores the SafeAreaView
  // padding of the player and has to clear the system bars itself.
  const insets = useSafeAreaInsets();
  // Without a native blur (Android) the regular glass tint lets the player
  // show through; the queue needs the dense one to stay readable.
  const background = glassMode
    ? SECONDARY_BLUR
      ? 'transparent'
      : GLASS.tintDense.thick
    : COLORS.background;

  return (
    <Presence
      visible={visible}
      from="bottom"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        backgroundColor: background,
      }}
    >
      {glassMode && SECONDARY_BLUR ? (
        <GlassSurface
          variant="thick"
          highlight={false}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 0,
          }}
        />
      ) : null}
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: LAYOUT.headerHeight,
          }}
        >
          <HeaderIconButton
            icon="chevron-down"
            onPress={onClose}
            accessibilityLabel={t('common.close')}
          />
          <AppText
            variant="caption"
            weight="medium"
            style={{ color: COLORS.textMuted, letterSpacing: 1, fontSize: 10 }}
          >
            {t('player.queue').toUpperCase()}
          </AppText>
          <View style={{ width: LAYOUT.iconButton }} />
        </View>

        <View
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: glassMode ? 16 : 10,
            backgroundColor: COLORS.accentSubtle,
            marginTop: 8,
            marginBottom: 16,
          }}
        >
          <AppText variant="label" weight="medium" numberOfLines={1}>
            {currentTrack.title}
          </AppText>
          <AppText
            variant="caption"
            numberOfLines={1}
            style={{ color: COLORS.textSecondary, fontSize: 11 }}
          >
            {currentTrack.artist.name}
          </AppText>
        </View>

        <AppText
          variant="caption"
          weight="medium"
          style={{
            color: COLORS.textSecondary,
            letterSpacing: 1,
            fontSize: 10,
            marginBottom: 8,
          }}
        >
          {t('player.nextUp').toUpperCase()} · {queue.length}
        </AppText>
        <FlashList
          data={queue}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          renderItem={({ item, index }) => (
            <Rise index={index} after={2} animate={index <= MOTION.staggerCap}>
              <TrackItem track={item} onPress={onPlay} />
            </Rise>
          )}
        />
      </View>
    </Presence>
  );
}

type PlayerScreenProps = {
  /** Pull-down-to-close, from the overlay that hosts the player. */
  dismissGesture?: { body: PanGesture; handle: PanGesture };
};

export default function PlayerScreen({ dismissGesture }: PlayerScreenProps) {
  const { t } = useI18n();
  const [showLyrics, setShowLyrics] = useState(false);
  const [showFx, setShowFx] = useState(false);
  const fxActive = useSettingsStore((s) => s.speed !== 1 || s.reverb > 0);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const queue = usePlayerStore((s) => s.queue);
  const showQueue = usePlayerStore((s) => s.showQueue);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const togglePlayback = usePlayerStore((s) => s.togglePlayback);
  const skipNext = usePlayerStore((s) => s.skipNext);
  const skipPrevious = usePlayerStore((s) => s.skipPrevious);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const setShowQueue = usePlayerStore((s) => s.setShowQueue);
  const play = usePlayerStore((s) => s.play);
  const closePlayer = usePlayerStore((s) => s.closePlayer);
  const accentColor = useDynamicAccent();
  const glassMode = useGlassMode();
  const [artScale] = useState(() => new RNAnimated.Value(1));

  const trackDurationSec =
    currentTrack?.durationSec ||
    (currentTrack ? parseDuration(currentTrack.duration) : 0);
  const lyrics = useTrackLyrics(currentTrack, trackDurationSec);

  useEffect(() => {
    // Desktop now-playing: the artwork sinks back while paused.
    const run = RNAnimated.spring(artScale, {
      toValue: isPlaying ? 1 : MOTION.pausedArtScale,
      ...DESKTOP_SPRING,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [isPlaying, artScale]);

  const artStyle = { transform: [{ scale: artScale }] };

  const handleSeek = useCallback(
    (value: number) => {
      setProgress(value);
    },
    [setProgress],
  );

  const handleLyricSeek = useCallback(
    (seconds: number) => {
      const totalDurationSec = audio.getDuration() || trackDurationSec;
      if (!totalDurationSec) return;
      const target = seconds + 0.05;
      const ratio = Math.max(0, Math.min(1, target / totalDurationSec));
      setProgress(ratio);
    },
    [trackDurationSec, setProgress],
  );

  if (!currentTrack) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText variant="body" style={{ color: COLORS.textMuted }}>
            {t('player.noTrack')}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  const scrollableOpen = showLyrics || showQueue;
  const bodyGesture = dismissGesture?.body.enabled(!scrollableOpen);
  const handleGesture = dismissGesture?.handle.enabled(scrollableOpen);
  const artRadius = glassMode ? 22 : 16;

  const header = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: LAYOUT.headerHeight,
      }}
    >
      <HeaderIconButton
        icon="chevron-down"
        onPress={() => closePlayer()}
        accessibilityLabel={t('common.close')}
      />
      <View
        style={{
          alignItems: 'center',
          gap: SPACING.xs,
        }}
      >
        {/* Grabber: says the whole player can be pulled down. */}
        <View
          style={{
            width: SPACING.huge,
            height: SPACING.xs,
            borderRadius: SPACING.xs / 2,
            backgroundColor: GLASS.rimStrong,
          }}
        />
        <AppText
          variant="caption"
          weight="medium"
          style={{
            color: glassMode ? COLORS.textSecondary : COLORS.textMuted,
            letterSpacing: 1,
            fontSize: 10,
          }}
        >
          {t('player.title').toUpperCase()}
        </AppText>
      </View>
      <HeaderIconButton
        icon="queue"
        onPress={() => setShowQueue(true)}
        accessibilityLabel={t('player.queue')}
      />
    </View>
  );

  const body = (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      {handleGesture ? (
        <GestureDetector gesture={handleGesture}>{header}</GestureDetector>
      ) : (
        header
      )}

      <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
        <RNAnimated.View
          style={[
            {
              aspectRatio: 1,
              width: '100%',
            },
            glassMode && Platform.OS === 'ios'
              ? {
                  shadowColor: '#000',
                  shadowOpacity: 0.45,
                  shadowRadius: 30,
                  shadowOffset: { width: 0, height: 18 },
                }
              : undefined,
            artStyle,
          ]}
        >
          <Rise key={showLyrics ? 'lyrics' : 'art'} style={{ flex: 1 }}>
            {showLyrics ? (
              <LyricsView
                key={currentTrack.id}
                syncedLyrics={lyrics.syncedLyrics}
                plainLyrics={lyrics.plainLyrics}
                loading={lyrics.loading}
                duration={trackDurationSec}
                onSeekToTime={handleLyricSeek}
                accentColor={accentColor}
              />
            ) : (
              <SwipeArtwork
                coverUrl={currentTrack.coverUrl}
                radius={artRadius}
              />
            )}
          </Rise>
        </RNAnimated.View>

        {/* Title and badge share one centred line; the artist sits under
            them. Desktop player text: a new track's title rises into place. */}
        <View style={{ gap: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Rise key={currentTrack.id} style={{ flex: 1, minWidth: 0 }}>
              <MarqueeText variant="title" weight="bold">
                {currentTrack.title}
              </MarqueeText>
            </Rise>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <SourceBadge source={currentTrack.source} />
              <DownloadButton
                track={currentTrack}
                size={18}
                accentColor={accentColor}
              />
              <AnimatedPressable
                scaleValue={0.85}
                hitSlop={10}
                onPress={() => setShowFx(true)}
                accessibilityRole="button"
                accessibilityLabel={t('fx.button')}
                accessibilityState={{ selected: fxActive }}
              >
                <AppIcon
                  name="fx"
                  size={20}
                  color={fxActive ? accentColor : COLORS.textSecondary}
                />
              </AnimatedPressable>
              <AnimatedPressable
                scaleValue={0.85}
                hitSlop={10}
                onPress={() => setShowLyrics((v) => !v)}
                accessibilityRole="button"
                accessibilityState={{ selected: showLyrics }}
              >
                <AppIcon
                  name="lyrics"
                  size={20}
                  color={showLyrics ? accentColor : COLORS.textSecondary}
                />
              </AnimatedPressable>
            </View>
          </View>
          <Rise key={`${currentTrack.id}:artist`} after={1}>
            <Pressable
              onPress={() => {
                if (
                  currentTrack.source === 'deezer' &&
                  currentTrack.artist.id
                ) {
                  closePlayer();
                  useOverlayStore.getState().openArtist(currentTrack.artist.id);
                }
              }}
              hitSlop={4}
            >
              <AppText
                variant="body"
                numberOfLines={1}
                style={{
                  color: COLORS.textSecondary,
                  textDecorationLine:
                    currentTrack.source === 'deezer' ? 'underline' : 'none',
                }}
              >
                {currentTrack.artist.name}
              </AppText>
            </Pressable>
          </Rise>
        </View>

        <PlaybackProgress
          durationSec={trackDurationSec}
          durationLabel={currentTrack.duration}
          isPlaying={isPlaying}
          accentColor={accentColor}
          glass={glassMode}
          onSeek={handleSeek}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 4,
          }}
        >
          <AnimatedPressable
            scaleValue={0.85}
            onPress={toggleShuffle}
            hitSlop={12}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon
              name="shuffle"
              size={20}
              color={shuffle ? accentColor : COLORS.textMuted}
            />
          </AnimatedPressable>

          <AnimatedPressable
            scaleValue={0.85}
            onPress={skipPrevious}
            hitSlop={12}
            style={{
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon
              name="previous"
              size={glassMode ? 32 : 24}
              color={COLORS.textPrimary}
            />
          </AnimatedPressable>

          <AnimatedPressable
            scaleValue={0.9}
            onPress={togglePlayback}
            // Desktop player: a solid white disc with a dark glyph, and an
            // accent ring that breathes out of it while music plays.
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.textPrimary,
            }}
          >
            <PlayRing playing={isPlaying} color={accentColor} />
            <Pop key={isPlaying ? 'pause' : 'play'}>
              <AppIcon
                name={isPlaying ? 'pause' : 'play'}
                size={30}
                color={COLORS.background}
              />
            </Pop>
          </AnimatedPressable>

          <AnimatedPressable
            scaleValue={0.85}
            onPress={skipNext}
            hitSlop={12}
            style={{
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon
              name="next"
              size={glassMode ? 32 : 24}
              color={COLORS.textPrimary}
            />
          </AnimatedPressable>

          <AnimatedPressable
            scaleValue={0.85}
            onPress={cycleRepeat}
            hitSlop={12}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon
              name={repeat === 'one' ? 'repeat-one' : 'repeat'}
              size={20}
              color={repeat !== 'off' ? accentColor : COLORS.textMuted}
            />
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: glassMode ? 'transparent' : COLORS.background,
      }}
    >
      {bodyGesture ? (
        <GestureDetector gesture={bodyGesture}>{body}</GestureDetector>
      ) : (
        body
      )}

      <QueueOverlay
        visible={showQueue}
        glassMode={glassMode}
        currentTrack={currentTrack}
        queue={queue}
        onClose={() => setShowQueue(false)}
        onPlay={(track) => {
          play(track);
          setShowQueue(false);
        }}
      />

      <FxSheet
        visible={showFx}
        onClose={() => setShowFx(false)}
        accentColor={accentColor}
      />
    </SafeAreaView>
  );
}

function parseDuration(duration: string): number {
  const [min, sec] = duration.split(':').map(Number);
  return (min ?? 0) * 60 + (sec ?? 0);
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
