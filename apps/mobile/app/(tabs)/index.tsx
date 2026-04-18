import { router } from "expo-router";
import { useEffect } from "react";
import { FlatList, Pressable, View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { SourceBadge } from "@/components/SourceBadge";
import { TrackItem } from "@/components/TrackItem";
import { AppIcon } from "@/components/ui/AppIcon";
import { AppText } from "@/components/ui/AppText";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { COLORS } from "@/constants/colors";
import { MOCK_DAILY_MIX, MOCK_RECENTLY_PLAYED } from "@/mocks/data";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useI18n } from "@/hooks/useI18n";
import type { Track } from "@/types/domain";

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
      <View
        style={{
          width: 160,
          height: 160,
          borderRadius: 14,
          backgroundColor: COLORS.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 0.5,
          borderColor: COLORS.border,
        }}
      >
        <AppIcon name="music" size={32} color={COLORS.textMuted} />
      </View>
      <View style={{ gap: 3 }}>
        <AppText
          variant="body"
          weight="medium"
          style={{ color: COLORS.textPrimary, fontSize: 14 }}
          numberOfLines={1}
        >
          {track.title}
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
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

  useEffect(() => {
    setQueue([...MOCK_RECENTLY_PLAYED, ...MOCK_DAILY_MIX]);
  }, [setQueue]);

  const handlePlay = (track: Track) => {
    play(track);
    router.push("/player" as const);
  };

  return (
    <ScreenContainer>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <AppText
          variant="display"
          weight="bold"
          style={{ letterSpacing: 2 }}
        >
          EXØS
        </AppText>
        <Pressable
          onPress={() => router.push("/settings" as const)}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
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
          style={{ color: COLORS.textSecondary, letterSpacing: 1, fontSize: 12 }}
        >
          {t("home.recentlyPlayed").toUpperCase()}
        </AppText>
        <FlatList
          data={MOCK_RECENTLY_PLAYED}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 14 }}
          renderItem={({ item }) => (
            <RecentCard track={item} onPress={() => handlePlay(item)} />
          )}
        />
      </View>

      <View style={{ gap: 14 }}>
        <AppText
          variant="label"
          weight="medium"
          style={{ color: COLORS.textSecondary, letterSpacing: 1, fontSize: 12 }}
        >
          {t("home.dailyMix").toUpperCase()}
        </AppText>
        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: COLORS.border,
          }}
        >
          {MOCK_DAILY_MIX.map((track) => (
            <TrackItem
              key={track.id}
              track={track}
              onPress={handlePlay}
              showBitrate
            />
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}
