import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { AppIcon } from "@/components/ui/AppIcon";
import { AppText } from "@/components/ui/AppText";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { COLORS } from "@/constants/colors";
import { useI18n } from "@/hooks/useI18n";
import type { UserProfile } from "@/types/domain";

const MOCK_PROFILE: UserProfile = {
  id: "user-1",
  name: "Alex Rivera",
  username: "alexsounds",
  followers: 1240,
  following: 312,
};

export default function ProfileScreen() {
  const { t } = useI18n();

  return (
    <ScreenContainer>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <AppText variant="display" weight="bold">
          {t("common.profile")}
        </AppText>
        <Pressable
          onPress={() => router.push("/settings" as const)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}
        >
          <AppIcon name="settings" size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingVertical: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: COLORS.divider,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: COLORS.surfaceMuted,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}
        >
          <AppText variant="title" weight="bold">
            {MOCK_PROFILE.name.charAt(0)}
          </AppText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="body" weight="bold">
            {MOCK_PROFILE.name}
          </AppText>
          <AppText variant="caption" style={{ color: COLORS.textMuted }}>
            @{MOCK_PROFILE.username}
          </AppText>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
            <AppText
              variant="caption"
              style={{ color: COLORS.textSecondary, fontSize: 11 }}
            >
              {MOCK_PROFILE.followers} {t("profile.followers")}
            </AppText>
            <AppText
              variant="caption"
              style={{ color: COLORS.textSecondary, fontSize: 11 }}
            >
              {MOCK_PROFILE.following} {t("profile.following")}
            </AppText>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => router.push("/library" as const)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 14,
          borderBottomWidth: 0.5,
          borderBottomColor: COLORS.divider,
        }}
      >
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
        >
          <AppIcon name="library" size={18} color={COLORS.textMuted} />
          <View style={{ gap: 2 }}>
            <AppText variant="label" weight="medium">
              {t("profile.openLibrary")}
            </AppText>
            <AppText
              variant="caption"
              style={{ color: COLORS.textMuted, fontSize: 11 }}
            >
              {t("profile.viewPlaylists")}
            </AppText>
          </View>
        </View>
        <AppIcon name="chevron-right" size={14} color={COLORS.textMuted} />
      </Pressable>
    </ScreenContainer>
  );
}
