import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { SourceBadge } from "@/components/SourceBadge";
import { TrackItem } from "@/components/TrackItem";
import { AppIcon } from "@/components/ui/AppIcon";
import { AppText } from "@/components/ui/AppText";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { COLORS } from "@/constants/colors";
import { useI18n } from "@/hooks/useI18n";
import { MOCK_PLAYLISTS, MOCK_TRACKS } from "@/mocks/data";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Track } from "@/types/domain";

const SAVED_TRACKS = MOCK_TRACKS.filter((t) => t.liked);

export default function LibraryScreen() {
  const { t } = useI18n();
  const { play } = usePlayerStore();

  const handlePlay = (track: Track) => {
    play(track);
    router.push("/player" as const);
  };

  return (
    <ScreenContainer>
      <AppText variant="display" weight="bold">
        {t("library.title")}
      </AppText>

      <View style={{ gap: 12 }}>
        <AppText
          variant="label"
          weight="medium"
          style={{ color: COLORS.textSecondary, letterSpacing: 1, fontSize: 11 }}
        >
          {t("library.playlists").toUpperCase()}
        </AppText>
        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: COLORS.border,
          }}
        >
          {MOCK_PLAYLISTS.map((playlist) => (
            <Pressable
              key={playlist.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                gap: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: COLORS.divider,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 6,
                  backgroundColor: COLORS.surfaceMuted,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 0.5,
                  borderColor: COLORS.border,
                }}
              >
                <AppIcon name="playlist" size={16} color={COLORS.textMuted} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText
                  variant="label"
                  weight="medium"
                  style={{ color: COLORS.textPrimary }}
                  numberOfLines={1}
                >
                  {playlist.name}
                </AppText>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <AppText
                    variant="caption"
                    style={{ color: COLORS.textMuted, fontSize: 11 }}
                  >
                    {playlist.tracksCount} {t("common.tracks")}
                  </AppText>
                  <SourceBadge source={playlist.source} />
                </View>
              </View>
              <AppIcon
                name="chevron-right"
                size={14}
                color={COLORS.textMuted}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <AppText
          variant="label"
          weight="medium"
          style={{ color: COLORS.textSecondary, letterSpacing: 1, fontSize: 11 }}
        >
          {t("library.savedTracks").toUpperCase()}
        </AppText>
        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: COLORS.border,
          }}
        >
          {SAVED_TRACKS.map((track) => (
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
