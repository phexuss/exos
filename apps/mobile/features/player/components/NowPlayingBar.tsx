import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { AppIcon } from "@/components/ui/AppIcon";
import { AppText } from "@/components/ui/AppText";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { useI18n } from "@/hooks/useI18n";
import type { Track } from "@/types/domain";

type NowPlayingBarProps = {
  track: Track;
  isPlaying?: boolean;
};

export function NowPlayingBar({ track, isPlaying }: NowPlayingBarProps) {
  const { t } = useI18n();

  return (
    <Pressable
      onPress={() => router.push("/player" as const)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: SPACING.md,
        padding: SPACING.md,
        borderRadius: 18,
        backgroundColor: COLORS.surfaceElevated,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="label" weight="bold">
          {track.title}
        </AppText>
        <AppText variant="caption" style={{ color: COLORS.textSecondary }}>
          {t("nowPlayingBar.label")} · {track.artist.name}
        </AppText>
      </View>
      <AppIcon
        name={isPlaying ? "pause" : "play"}
        size={30}
        color={COLORS.textPrimary}
      />
    </Pressable>
  );
}
