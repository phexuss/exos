import { View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { SourceBadge } from "@/components/SourceBadge";
import { AppText } from "@/components/ui/AppText";
import { COLORS } from "@/constants/colors";
import type { Track } from "@/types/domain";

type TrackItemProps = {
  track: Track;
  onPress?: (track: Track) => void;
  showBitrate?: boolean;
};

export function TrackItem({ track, onPress, showBitrate }: TrackItemProps) {
  return (
    <AnimatedPressable
      onPress={() => onPress?.(track)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        gap: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.divider,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 10,
          backgroundColor: COLORS.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 0.5,
          borderColor: COLORS.border,
        }}
      >
        <AppText
          variant="body"
          weight="bold"
          style={{ color: COLORS.textMuted }}
        >
          {track.artist.name.charAt(0)}
        </AppText>
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <AppText
          variant="body"
          weight="medium"
          style={{ color: COLORS.textPrimary, fontSize: 15 }}
          numberOfLines={1}
        >
          {track.title}
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <AppText
            variant="caption"
            style={{ color: COLORS.textMuted, fontSize: 13 }}
            numberOfLines={1}
          >
            {track.artist.name}
          </AppText>
          <SourceBadge source={track.source} />
          {showBitrate && track.bitrate ? (
            <AppText
              variant="caption"
              weight="medium"
              style={{
                fontSize: 10,
                letterSpacing: 0.5,
                color:
                  track.bitrate === "FLAC" ? COLORS.accent : COLORS.textMuted,
              }}
            >
              {track.bitrate}
            </AppText>
          ) : null}
        </View>
      </View>

      <AppText
        variant="caption"
        style={{ color: COLORS.textMuted, fontSize: 13 }}
      >
        {track.duration}
      </AppText>
    </AnimatedPressable>
  );
}
