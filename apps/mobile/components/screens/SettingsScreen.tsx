import { Pressable, Switch, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { COLORS } from '@/constants/colors';
import { useI18n } from '@/hooks/useI18n';
import { useOverlayStore } from '@/store/useOverlayStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export function SettingsScreen() {
  const { locale, setLocale, t } = useI18n();
  const { dynamicAccent, setDynamicAccent } = useSettingsStore();
  const closeSettings = useOverlayStore((s) => s.closeSettings);

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={closeSettings}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="chevron-right" size={22} color={COLORS.textMuted} />
        </Pressable>
        <AppText variant="label" weight="bold">
          {t('settings.title')}
        </AppText>
        <View style={{ width: 36 }} />
      </View>

      {/* Language */}
      <View style={{ gap: 14, marginTop: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AppIcon name="globe" size={16} color={COLORS.textMuted} />
          <AppText
            variant="label"
            weight="medium"
            style={{
              color: COLORS.textSecondary,
              letterSpacing: 1,
              fontSize: 11,
            }}
          >
            {t('settings.languageSection').toUpperCase()}
          </AppText>
        </View>

        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: COLORS.border,
          }}
        >
          <Pressable
            onPress={() => setLocale('en')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 14,
              borderBottomWidth: 0.5,
              borderBottomColor: COLORS.divider,
            }}
          >
            <AppText variant="label" weight="medium">
              {t('common.english')}
            </AppText>
            {locale === 'en' ? (
              <AppIcon name="check" size={16} color={COLORS.accent} />
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => setLocale('ru')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 14,
              borderBottomWidth: 0.5,
              borderBottomColor: COLORS.divider,
            }}
          >
            <AppText variant="label" weight="medium">
              {t('common.russian')}
            </AppText>
            {locale === 'ru' ? (
              <AppIcon name="check" size={16} color={COLORS.accent} />
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* Appearance */}
      <View style={{ gap: 14, marginTop: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AppIcon name="palette" size={16} color={COLORS.textMuted} />
          <AppText
            variant="label"
            weight="medium"
            style={{
              color: COLORS.textSecondary,
              letterSpacing: 1,
              fontSize: 11,
            }}
          >
            {t('settings.appearanceSection').toUpperCase()}
          </AppText>
        </View>

        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: COLORS.border,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 14,
              borderBottomWidth: 0.5,
              borderBottomColor: COLORS.divider,
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <AppText variant="label" weight="medium">
                {t('settings.dynamicAccent')}
              </AppText>
              <AppText
                variant="caption"
                style={{ color: COLORS.textMuted, marginTop: 2 }}
              >
                {t('settings.dynamicAccentDesc')}
              </AppText>
            </View>
            <Switch
              value={dynamicAccent}
              onValueChange={setDynamicAccent}
              trackColor={{
                false: COLORS.surfaceMuted,
                true: COLORS.accent,
              }}
              thumbColor={COLORS.textPrimary}
            />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
