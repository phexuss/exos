import { View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { COLORS } from "@/constants/colors";
import { SOURCES, type SourceKey } from "@/constants/sources";

type SourceBadgeProps = {
  source: SourceKey;
};

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <View
      style={{
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
      }}
    >
      <AppText
        variant="caption"
        weight="medium"
        style={{
          fontSize: 9,
          lineHeight: 12,
          letterSpacing: 1,
          color: COLORS.textMuted,
        }}
      >
        {SOURCES[source].badge}
      </AppText>
    </View>
  );
}
