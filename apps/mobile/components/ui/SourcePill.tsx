import { View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { COLORS } from "@/constants/colors";
import { SOURCES, type SourceKey } from "@/constants/sources";

type SourcePillProps = {
  source: SourceKey;
  selected?: boolean;
};

export function SourcePill({ source, selected }: SourcePillProps) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 0.5,
        borderColor: selected ? COLORS.accent : COLORS.border,
        backgroundColor: selected
          ? "rgba(99, 102, 241, 0.12)"
          : "transparent",
      }}
    >
      <AppText
        variant="caption"
        weight="medium"
        style={{
          color: selected ? COLORS.accent : COLORS.textMuted,
          letterSpacing: 0.5,
        }}
      >
        {SOURCES[source].label}
      </AppText>
    </View>
  );
}
