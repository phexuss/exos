import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { Pressable, Animated as RNAnimated, View } from 'react-native';
import { GestureDetector, type PanGesture } from 'react-native-gesture-handler';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { DownloadButton } from '@/components/DownloadButton';
import { FxSheet } from '@/components/FxSheet';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { LyricsEditor } from '@/components/LyricsEditor';
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
import { AppIcon, type IconName } from '@/components/ui/AppIcon';
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
import { haptic } from '@/utils/haptics';

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
  const timeTone = {
    color: scrubRatio === null ? COLORS.textMuted : COLORS.textPrimary,
  };

  return (
    <View>
      <SeekBar
        progress={progress}
        isPlaying={isPlaying}
        onSeek={onSeek}
        onSeekStart={() => {
          haptic('tick');
          audio.startSeeking();
        }}
        onSeekEnd={audio.stopSeeking}
        onScrub={setScrubRatio}
        accentColor={accentColor}
        glass={glass}
      />
      {/* The bar keeps a tall touch area; the times tuck up under the line
          itself and light up while a finger moves it. */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: -SPACING.sm,
        }}
      >
        <AppText variant="caption" style={[TIME_STYLE, timeTone]}>
          {formatTime(displayedCurrentTimeSec)}
        </AppText>
        <AppText variant="caption" style={[TIME_STYLE, timeTone]}>
          {durationLabel}
        </AppText>
      </View>
    </View>
  );
}

const TIME_STYLE = {
  fontSize: 11,
  fontVariant: ['tabular-nums' as const],
};

/** The cover floats over the backdrop on a soft, wide shadow. */
const ART_SHADOW = {
  boxShadow: [
    {
      offsetX: 0,
      offsetY: 18,
      blurRadius: 36,
      spreadDistance: -6,
      color: 'rgba(0,0,0,0.5)',
    },
  ],
};

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
        style={[{ flex: 1, borderRadius: radius }, ART_SHADOW, swipe.style]}
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
          paddingHorizontal: SPACING.xxl,
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

type ModeButtonProps = {
  icon: IconName;
  on: boolean;
  color: string;
  label: string;
  onPress: () => void;
};

/** Shuffle and repeat: tinted while on, with a dot under the glyph. */
function ModeButton({ icon, on, color, label, onPress }: ModeButtonProps) {
  return (
    <AnimatedPressable
      scaleValue={0.85}
      haptic={on ? 'off' : 'on'}
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      style={{
        width: LAYOUT.minTouch,
        height: LAYOUT.minTouch,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppIcon name={icon} size={22} color={on ? color : COLORS.textMuted} />
      {on ? (
        <Pop>
          <View
            style={{
              position: 'absolute',
              alignSelf: 'center',
              top: SPACING.xs,
              width: SPACING.xs,
              height: SPACING.xs,
              borderRadius: SPACING.xs / 2,
              backgroundColor: color,
            }}
          />
        </Pop>
      ) : null}
    </AnimatedPressable>
  );
}

type ActionButtonProps = {
  on?: boolean;
  /** Leave both out for a slot whose child is a button itself. */
  label?: string;
  onPress?: () => void;
  children: ReactNode;
};

/** One of the quiet actions under the transport; lit on a soft disc while on. */
function ActionButton({ on, label, onPress, children }: ActionButtonProps) {
  const box = {
    width: LAYOUT.minTouch,
    height: LAYOUT.minTouch,
    borderRadius: LAYOUT.minTouch / 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: on ? GLASS.selection : 'transparent',
  };
  if (!onPress) return <View style={box}>{children}</View>;
  return (
    <AnimatedPressable
      scaleValue={0.85}
      haptic="tick"
      onPress={onPress}
      hitSlop={SPACING.sm}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!on }}
      style={box}
    >
      {children}
    </AnimatedPressable>
  );
}

type PlayerScreenProps = {
  /** Pull-down-to-close, from the overlay that hosts the player. */
  dismissGesture?: { body: PanGesture; handle: PanGesture };
  /** False while the player is put away: its endless loops rest. */
  active?: boolean;
};

export default function PlayerScreen({
  dismissGesture,
  active = true,
}: PlayerScreenProps) {
  const { t } = useI18n();
  const [showLyrics, setShowLyrics] = useState(false);
  const [showFx, setShowFx] = useState(false);
  /**
   * Lyrics editor, with the track and lyrics it was opened on: the queue
   * moving on mustn't swap them out from under an edit.
   */
  const [editLyrics, setEditLyrics] = useState<{
    track: Track;
    durationSec: number;
    find: boolean;
    syncedLyrics?: string;
    plainLyrics?: string;
    custom: boolean;
  } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  /** The room between the header and the title: the cover fits inside it. */
  const [stage, setStage] = useState({ width: 0, height: 0 });
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
  const artSize = Math.floor(Math.min(stage.width, stage.height));
  const canOpenArtist =
    currentTrack.source === 'deezer' && !!currentTrack.artist.id;

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
    <View style={{ flex: 1, paddingHorizontal: PAGE }}>
      {handleGesture ? (
        <GestureDetector gesture={handleGesture}>{header}</GestureDetector>
      ) : (
        header
      )}

      {/* The cover takes whatever room is left and stays square inside it,
          so short screens shrink the cover instead of pushing the controls
          off the bottom. Lyrics get the whole room. */}
      <View
        style={{
          flex: 1,
          marginVertical: SPACING.md,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setStage((now) =>
            now.width === width && now.height === height
              ? now
              : { width, height },
          );
        }}
      >
        {showLyrics ? (
          <Rise key="lyrics" style={{ flex: 1, alignSelf: 'stretch' }}>
            <LyricsView
              key={currentTrack.id}
              syncedLyrics={lyrics.syncedLyrics}
              plainLyrics={lyrics.plainLyrics}
              loading={lyrics.loading}
              duration={trackDurationSec}
              onSeekToTime={handleLyricSeek}
              accentColor={accentColor}
              onEdit={(find) => {
                setEditLyrics({
                  track: currentTrack,
                  durationSec: trackDurationSec,
                  find,
                  syncedLyrics: lyrics.syncedLyrics,
                  plainLyrics: lyrics.plainLyrics,
                  custom: lyrics.custom,
                });
                setEditorOpen(true);
              }}
            />
          </Rise>
        ) : artSize > 0 ? (
          <Rise key="art">
            <RNAnimated.View
              style={{
                width: artSize,
                height: artSize,
                transform: [{ scale: artScale }],
              }}
            >
              <SwipeArtwork
                coverUrl={currentTrack.coverUrl}
                radius={artRadius}
              />
            </RNAnimated.View>
          </Rise>
        ) : null}
      </View>

      {/* Title over artist, as on the desktop player: a new track's text
          rises into place. With the lyrics up, the cover sits beside it as
          a thumbnail. */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}
      >
        {showLyrics && currentTrack.coverUrl ? (
          <Pop>
            <Image
              source={{ uri: currentTrack.coverUrl }}
              style={{
                width: THUMB,
                height: THUMB,
                borderRadius: SPACING.md,
              }}
              contentFit="cover"
              transition={MOTION.dur.base}
            />
          </Pop>
        ) : null}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Rise key={currentTrack.id}>
            <MarqueeText
              variant="title"
              weight="bold"
              bleed={showLyrics ? 0 : PAGE}
              paused={!active}
            >
              {currentTrack.title}
            </MarqueeText>
          </Rise>
          <Rise
            key={`${currentTrack.id}:artist`}
            after={1}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.sm,
            }}
          >
            <Pressable
              disabled={!canOpenArtist}
              onPress={() => {
                closePlayer();
                useOverlayStore.getState().openArtist(currentTrack.artist.id);
              }}
              hitSlop={SPACING.sm}
              style={{ flexShrink: 1 }}
            >
              <AppText
                variant="body"
                numberOfLines={1}
                style={{ color: COLORS.textSecondary, fontSize: 17 }}
              >
                {currentTrack.artist.name}
              </AppText>
            </Pressable>
            <SourceBadge source={currentTrack.source} />
          </Rise>
        </View>
      </View>

      <View style={{ marginTop: SPACING.sm }}>
        <PlaybackProgress
          durationSec={trackDurationSec}
          durationLabel={currentTrack.duration}
          isPlaying={isPlaying}
          accentColor={accentColor}
          glass={glassMode}
          onSeek={handleSeek}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: SPACING.md,
        }}
      >
        <ModeButton
          icon="shuffle"
          on={shuffle}
          color={accentColor}
          label={t('player.shuffle')}
          onPress={toggleShuffle}
        />

        <AnimatedPressable
          scaleValue={0.82}
          haptic="tap"
          onPress={skipPrevious}
          hitSlop={SPACING.md}
          accessibilityRole="button"
          accessibilityLabel={t('player.previous')}
          style={SKIP_BOX}
        >
          <AppIcon name="previous-solid" size={34} color={COLORS.textPrimary} />
        </AnimatedPressable>

        <AnimatedPressable
          scaleValue={0.9}
          haptic="tap"
          onPress={togglePlayback}
          accessibilityRole="button"
          accessibilityLabel={t(isPlaying ? 'player.pause' : 'player.play')}
          // Desktop player: a solid white disc with a dark glyph, and an
          // accent ring that breathes out of it while music plays.
          style={{
            width: PLAY_DISC,
            height: PLAY_DISC,
            borderRadius: PLAY_DISC / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: COLORS.textPrimary,
          }}
        >
          <PlayRing playing={isPlaying && active} color={accentColor} />
          <Pop key={isPlaying ? 'pause' : 'play'}>
            <AppIcon
              name={isPlaying ? 'pause-solid' : 'play-solid'}
              size={32}
              color={COLORS.background}
            />
          </Pop>
        </AnimatedPressable>

        <AnimatedPressable
          scaleValue={0.82}
          haptic="tap"
          onPress={skipNext}
          hitSlop={SPACING.md}
          accessibilityRole="button"
          accessibilityLabel={t('player.next')}
          style={SKIP_BOX}
        >
          <AppIcon name="next-solid" size={34} color={COLORS.textPrimary} />
        </AnimatedPressable>

        <ModeButton
          icon={repeat === 'one' ? 'repeat-one' : 'repeat'}
          on={repeat !== 'off'}
          color={accentColor}
          label={t('player.repeat')}
          onPress={cycleRepeat}
        />
      </View>

      {/* What used to crowd the title: lyrics, sound, download. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: SPACING.lg,
          marginBottom: SPACING.sm,
          paddingHorizontal: SPACING.xxxl,
        }}
      >
        <ActionButton
          on={showLyrics}
          label={t('player.lyrics')}
          onPress={() => setShowLyrics((v) => !v)}
        >
          <AppIcon
            name="lyrics"
            size={22}
            color={showLyrics ? COLORS.textPrimary : COLORS.textSecondary}
          />
        </ActionButton>
        <ActionButton
          on={fxActive}
          label={t('fx.button')}
          onPress={() => setShowFx(true)}
        >
          <AppIcon
            name="fx"
            size={22}
            color={fxActive ? accentColor : COLORS.textSecondary}
          />
        </ActionButton>
        <ActionButton>
          <DownloadButton
            track={currentTrack}
            size={22}
            accentColor={accentColor}
          />
        </ActionButton>
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

      {editLyrics ? (
        <LyricsEditor
          key={editLyrics.track.id}
          visible={editorOpen}
          track={editLyrics.track}
          durationSec={editLyrics.durationSec}
          syncedLyrics={editLyrics.syncedLyrics}
          plainLyrics={editLyrics.plainLyrics}
          custom={editLyrics.custom}
          startOnFind={editLyrics.find}
          accentColor={accentColor}
          onClose={() => setEditorOpen(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

/** Side padding of the player page. */
const PAGE = SPACING.xxl;
const PLAY_DISC = 76;
/** The cover beside the title while lyrics have its place. */
const THUMB = 52;
const SKIP_BOX = {
  width: 56,
  height: 56,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

function parseDuration(duration: string): number {
  const [min, sec] = duration.split(':').map(Number);
  return (min ?? 0) * 60 + (sec ?? 0);
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
