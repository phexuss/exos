import { Image, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { useI18n } from "@/hooks/useI18n";
import type { UserProfile } from "@/types/domain";

type ProfileHeaderProps = {
  profile: UserProfile;
};

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { t } = useI18n();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.lg,
        padding: SPACING.lg,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      {profile.avatarUrl ? (
        <Image
          source={{ uri: profile.avatarUrl }}
          style={{ width: 72, height: 72, borderRadius: 36 }}
        />
      ) : (
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: COLORS.surfaceMuted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppText variant="title" weight="bold">
            {profile.name.charAt(0)}
          </AppText>
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="title" weight="bold">
          {profile.name}
        </AppText>
        <AppText variant="caption" style={{ color: COLORS.textSecondary }}>
          @{profile.username}
        </AppText>
        <View style={{ flexDirection: "row", gap: SPACING.lg }}>
          <AppText variant="caption" style={{ color: COLORS.textSecondary }}>
            {profile.followers} {t("profile.followers")}
          </AppText>
          <AppText variant="caption" style={{ color: COLORS.textSecondary }}>
            {profile.following} {t("profile.following")}
          </AppText>
        </View>
      </View>
    </View>
  );
}
