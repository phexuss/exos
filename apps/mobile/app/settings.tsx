import { Pressable, View } from "react-native";

import { AppIcon } from "@/components/ui/AppIcon";
import { AppText } from "@/components/ui/AppText";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { COLORS } from "@/constants/colors";
import { useI18n } from "@/hooks/useI18n";

export default function SettingsScreen() {
  const { locale, setLocale, t } = useI18n();

  return (
    <ScreenContainer>
      <AppText variant="display" weight="bold">
        {t("settings.title")}
      </AppText>

      <View style={{ gap: 14 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AppIcon name="globe" size={16} color={COLORS.textMuted} />
          <AppText
            variant="label"
            weight="medium"
            style={{ color: COLORS.textSecondary, letterSpacing: 1, fontSize: 11 }}
          >
            {t("settings.languageSection").toUpperCase()}
          </AppText>
        </View>

        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: COLORS.border,
          }}
        >
          <Pressable
            onPress={() => setLocale("en")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 14,
              borderBottomWidth: 0.5,
              borderBottomColor: COLORS.divider,
            }}
          >
            <AppText variant="label" weight="medium">
              {t("common.english")}
            </AppText>
            {locale === "en" ? (
              <AppIcon name="check" size={16} color={COLORS.accent} />
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => setLocale("ru")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 14,
              borderBottomWidth: 0.5,
              borderBottomColor: COLORS.divider,
            }}
          >
            <AppText variant="label" weight="medium">
              {t("common.russian")}
            </AppText>
            {locale === "ru" ? (
              <AppIcon name="check" size={16} color={COLORS.accent} />
            ) : null}
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
