import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { DownloadButton } from '@/components/DownloadButton';
import { LyricsView } from '@/components/LyricsView';
import { SeekBar } from '@/components/SeekBar';
import { SourceBadge } from '@/components/SourceBadge';
import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Skeleton } from '@/components/ui/Skeleton';
import { COLORS } from '@/constants/colors';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useI18n } from '@/hooks/useI18n';
import * as audio from '@/services/audio/audioService';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';

export default function PlayerScreen() {
  const { t } = useI18n();
  const [showLyrics, setShowLyrics] = useState(false);
  const [scrubRatio, setScrubRatio] = useState<number | null>(null);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
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
  const markTrackDownloaded = usePlayerStore((s) => s.markTrackDownloaded);
  const closePlayer = usePlayerStore((s) => s.closePlayer);
  const accentColor = useDynamicAccent();
  const startSeeking = audio.startSeeking;
  const stopSeeking = audio.stopSeeking;

  const totalDurationSec =
    audio.getDuration() ||
    currentTrack?.durationSec ||
    (currentTrack ? parseDuration(currentTrack.duration) : 0);
  const displayedRatio = scrubRatio ?? progress;
  const displayedCurrentTimeSec = displayedRatio * (totalDurationSec || 0);

  const handleSeek = useCallback(
    (value: number) => {
      setProgress(value);
    },
    [setProgress],
  );

  const handleLyricSeek = useCallback(
    (seconds: number) => {
      if (!totalDurationSec) return;
      const target = seconds + 0.05;
      const ratio = Math.max(0, Math.min(1, target / totalDurationSec));
      setProgress(ratio);
    },
    [totalDurationSec, setProgress],
  );

  if (!currentTrack) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText variant="body" style={{ color: COLORS.textMuted }}>
            No track selected
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (showQueue) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
          }}
        >
          <Pressable onPress={() => setShowQueue(false)} hitSlop={12}>
            <AppIcon name="chevron-down" size={24} color={COLORS.textMuted} />
          </Pressable>
          <AppText
            variant="caption"
            weight="medium"
            style={{ color: COLORS.textMuted, letterSpacing: 1, fontSize: 10 }}
          >
            QUEUE
          </AppText>
          <View style={{ width: 24 }} />
        </View>

        <AppText
          variant="caption"
          weight="medium"
          style={{
            color: COLORS.textSecondary,
            letterSpacing: 1,
            fontSize: 10,
            marginBottom: 8,
            marginTop: 8,
          }}
        >
          NOW PLAYING
        </AppText>
        <View
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: COLORS.accentSubtle,
            marginBottom: 16,
          }}
        >
          <AppText variant="label" weight="medium">
            {currentTrack.title}
          </AppText>
          <AppText
            variant="caption"
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
          NEXT UP · {queue.length} TRACKS
        </AppText>
        <FlatList
          data={queue}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TrackItem
              track={item}
              onPress={(t) => {
                play(t);
                setShowQueue(false);
              }}
            />
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingHorizontal: 24,
        backgroundColor: COLORS.background,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
        }}
      >
        <Pressable onPress={() => closePlayer()} hitSlop={12}>
          <AppIcon name="chevron-down" size={24} color={COLORS.textMuted} />
        </Pressable>
        <AppText
          variant="caption"
          weight="medium"
          style={{ color: COLORS.textMuted, letterSpacing: 1, fontSize: 10 }}
        >
          {t('player.title').toUpperCase()}
        </AppText>
        <Pressable onPress={() => setShowQueue(true)} hitSlop={12}>
          <AppIcon name="queue" size={22} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
        <View
          style={{
            aspectRatio: 1,
            width: '100%',
          }}
        >
          <Animated.View
            key={showLyrics ? 'lyrics' : 'art'}
            entering={FadeIn.duration(350)}
            exiting={FadeOut.duration(250)}
            style={{
              flex: 1,
            }}
          >
            {showLyrics ? (
              <LyricsView
                syncedLyrics={currentTrack.syncedLyrics}
                plainLyrics={currentTrack.plainLyrics}
                progress={progress}
                duration={totalDurationSec}
                onSeekToTime={handleLyricSeek}
                accentColor={accentColor}
              />
            ) : currentTrack.coverUrl ? (
              <Image
                source={{ uri: currentTrack.coverUrl }}
                style={{
                  flex: 1,
                  borderRadius: 16,
                }}
                resizeMode="cover"
              />
            ) : (
              <Skeleton width="100%" height="100%" radius={16} />
            )}
          </Animated.View>
        </View>

        <View style={{ gap: 6 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="title" weight="bold">
                {currentTrack.title}
              </AppText>
              <Pressable
                onPress={() => {
                  if (
                    currentTrack.source === 'deezer' &&
                    currentTrack.artist.id
                  ) {
                    closePlayer();
                    useOverlayStore
                      .getState()
                      .openArtist(currentTrack.artist.id);
                  }
                }}
                hitSlop={4}
              >
                <AppText
                  variant="body"
                  style={{
                    color: COLORS.textSecondary,
                    textDecorationLine:
                      currentTrack.source === 'deezer' ? 'underline' : 'none',
                  }}
                >
                  {currentTrack.artist.name}
                </AppText>
              </Pressable>
            </View>
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
                onDownloaded={(track, filePath) => {
                  markTrackDownloaded(track.id, filePath);
                }}
              />
              <Pressable hitSlop={10} onPress={() => setShowLyrics((v) => !v)}>
                <AppIcon
                  name="lyrics"
                  size={20}
                  color={showLyrics ? COLORS.accent : COLORS.textSecondary}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <SeekBar
            progress={progress}
            onSeek={handleSeek}
            onSeekStart={startSeeking}
            onSeekEnd={stopSeeking}
            onScrub={setScrubRatio}
            accentColor={accentColor}
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
              {currentTrack.duration}
            </AppText>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 4,
          }}
        >
          <Pressable
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
              color={shuffle ? COLORS.accent : COLORS.textMuted}
            />
          </Pressable>

          <AnimatedPressable
            scaleValue={0.9}
            onPress={skipPrevious}
            hitSlop={12}
            style={{
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="previous" size={24} color={COLORS.textPrimary} />
          </AnimatedPressable>

          <AnimatedPressable
            scaleValue={0.98}
            onPress={togglePlayback}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.textPrimary,
            }}
          >
            <AppIcon
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color={COLORS.background}
            />
          </AnimatedPressable>

          <AnimatedPressable
            scaleValue={0.9}
            onPress={skipNext}
            hitSlop={12}
            style={{
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="next" size={24} color={COLORS.textPrimary} />
          </AnimatedPressable>

          <Pressable
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
              color={repeat !== 'off' ? COLORS.accent : COLORS.textMuted}
            />
          </Pressable>
        </View>
      </View>
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
