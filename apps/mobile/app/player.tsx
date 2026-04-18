import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { SeekBar } from "@/components/SeekBar";
import { SourceBadge } from "@/components/SourceBadge";
import { TrackItem } from "@/components/TrackItem";
import { AppIcon } from "@/components/ui/AppIcon";
import { AppText } from "@/components/ui/AppText";
import { COLORS } from "@/constants/colors";
import { useI18n } from "@/hooks/useI18n";
import { useMockPlayback } from "@/hooks/useMockPlayback";
import { usePlayerStore } from "@/store/usePlayerStore";

export default function PlayerScreen() {
  const { t } = useI18n();
  const [showLyrics, setShowLyrics] = useState(false);
  const {
    currentTrack,
    isPlaying,
    progress,
    setProgress,
    togglePlayback,
    skipNext,
    skipPrevious,
    shuffle,
    repeat,
    toggleShuffle,
    cycleRepeat,
    queue,
    showQueue,
    setShowQueue,
    play,
  } = usePlayerStore();
  const { startSeeking, stopSeeking } = useMockPlayback();

  if (!currentTrack) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
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
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
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
              showBitrate
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
        backgroundColor: COLORS.background,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <AppIcon name="chevron-down" size={24} color={COLORS.textMuted} />
        </Pressable>
        <AppText
          variant="caption"
          weight="medium"
          style={{ color: COLORS.textMuted, letterSpacing: 1, fontSize: 10 }}
        >
          {t("player.title").toUpperCase()}
        </AppText>
        <Pressable onPress={() => setShowQueue(true)} hitSlop={12}>
          <AppIcon name="queue" size={22} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <View style={{ flex: 1, justifyContent: "center", gap: 24 }}>
        <View
          style={{
            aspectRatio: 1,
            width: "100%",
          }}
        >
          <Animated.View
            key={showLyrics && currentTrack.lyrics ? "lyrics" : "art"}
            entering={FadeIn.duration(350)}
            exiting={FadeOut.duration(250)}
            style={{
              flex: 1,
            }}
          >
            {showLyrics && currentTrack.lyrics ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                fadingEdgeLength={40}
                contentContainerStyle={{
                  paddingVertical: 12,
                  paddingHorizontal: 4,
                  gap: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  flexGrow: 1,
                }}
              >
                {currentTrack.lyrics.map((line, i) => (
                  <AppText
                    key={i}
                    variant="title"
                    weight={line ? "bold" : "regular"}
                    style={{
                      color: line
                        ? COLORS.textPrimary
                        : "transparent",
                      fontSize: 20,
                      lineHeight: 32,
                      textAlign: "center",
                      opacity: line ? 0.85 : 0,
                    }}
                  >
                    {line || " "}
                  </AppText>
                ))}
              </ScrollView>
            ) : (
              <View
                style={{
                  flex: 1,
                  borderRadius: 16,
                  backgroundColor: COLORS.surfaceMuted,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 0.5,
                  borderColor: COLORS.border,
                }}
              >
                <AppIcon name="music" size={64} color={COLORS.textMuted} />
              </View>
            )}
          </Animated.View>
        </View>

        <View style={{ gap: 6 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="title" weight="bold">
                {currentTrack.title}
              </AppText>
              <AppText
                variant="body"
                style={{ color: COLORS.textSecondary }}
              >
                {currentTrack.artist.name}
              </AppText>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <SourceBadge source={currentTrack.source} />
              <Pressable
                hitSlop={10}
                onPress={() =>
                  currentTrack.lyrics && setShowLyrics((v) => !v)
                }
              >
                <AppIcon
                  name="lyrics"
                  size={20}
                  color={
                    showLyrics
                      ? COLORS.accent
                      : currentTrack.lyrics
                        ? COLORS.textSecondary
                        : COLORS.textMuted
                  }
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <SeekBar
            progress={progress}
            onSeek={setProgress}
            onSeekStart={startSeeking}
            onSeekEnd={stopSeeking}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <AppText
              variant="caption"
              style={{ color: COLORS.textMuted, fontSize: 10 }}
            >
              {formatTime(progress * parseDuration(currentTrack.duration))}
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
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 4,
          }}
        >
          <Pressable
            onPress={toggleShuffle}
            hitSlop={12}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon
              name="shuffle"
              size={20}
              color={shuffle ? COLORS.accent : COLORS.textMuted}
            />
          </Pressable>

          <AnimatedPressable
            scaleValue={0.85}
            onPress={skipPrevious}
            hitSlop={12}
            style={{
              width: 48,
              height: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name="previous" size={24} color={COLORS.textPrimary} />
          </AnimatedPressable>

          <AnimatedPressable
            scaleValue={0.9}
            onPress={togglePlayback}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: COLORS.textPrimary,
            }}
          >
            <AppIcon
              name={isPlaying ? "pause" : "play"}
              size={28}
              color={COLORS.background}
            />
          </AnimatedPressable>

          <AnimatedPressable
            scaleValue={0.85}
            onPress={skipNext}
            hitSlop={12}
            style={{
              width: 48,
              height: 48,
              alignItems: "center",
              justifyContent: "center",
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
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon
              name={repeat === "one" ? "repeat-one" : "repeat"}
              size={20}
              color={repeat !== "off" ? COLORS.accent : COLORS.textMuted}
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function parseDuration(duration: string): number {
  const [min, sec] = duration.split(":").map(Number);
  return (min ?? 0) * 60 + (sec ?? 0);
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
