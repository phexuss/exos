import { type ReactNode, useState } from 'react';
import {
  Pressable,
  type StyleProp,
  Switch,
  View,
  type ViewStyle,
} from 'react-native';

import { AppDialog } from '@/components/AppDialog';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { RestoreLibraryModal } from '@/components/RestoreLibraryModal';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { COLORS } from '@/constants/colors';
import { useI18n } from '@/hooks/useI18n';
import * as audio from '@/services/audio/audioService';
import { clearLocalDatabase } from '@/services/db/database';
import { clearDownloadedTrackFiles } from '@/services/download/downloadService';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useOverlayStore } from '@/store/useOverlayStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';

type SettingsGroupProps = {
  glass: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

function SettingsGroup({ glass, style, children }: SettingsGroupProps) {
  if (glass) {
    return (
      <GlassSurface
        blur={false}
        variant="regular"
        style={[{ borderRadius: 22 }, style]}
        contentStyle={{ paddingHorizontal: 16 }}
      >
        {children}
      </GlassSurface>
    );
  }

  return (
    <View
      style={[{ borderTopWidth: 0.5, borderTopColor: COLORS.border }, style]}
    >
      {children}
    </View>
  );
}

export function SettingsScreen() {
  const { locale, setLocale, t } = useI18n();
  const { dynamicAccent, setDynamicAccent, glassMode, setGlassMode } =
    useSettingsStore();
  const closeSettings = useOverlayStore((s) => s.closeSettings);
  const openFaq = useOverlayStore((s) => s.openFaq);
  const user = useAuthStore((s) => s.user);
  const [showRestoreLibrary, setShowRestoreLibrary] = useState(false);
  const [showClearCache, setShowClearCache] = useState(false);
  const [clearCacheBusy, setClearCacheBusy] = useState(false);
  const [clearCacheError, setClearCacheError] = useState<string | null>(null);

  const handleClearCache = async () => {
    setClearCacheBusy(true);
    setClearCacheError(null);
    try {
      audio.releaseAudio();
      await clearDownloadedTrackFiles();
      await clearLocalDatabase();
      useDownloadStore.getState().clearAll();
      setShowClearCache(false);
    } catch (e) {
      if (__DEV__) console.warn('[Settings] Clear cache failed:', e);
      setClearCacheError(t('settings.clearCacheError'));
    } finally {
      setClearCacheBusy(false);
    }
  };

  return (
    <ScreenContainer>
      {}
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

      {}
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

        <SettingsGroup glass={glassMode}>
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
        </SettingsGroup>
      </View>

      {}
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

        <SettingsGroup glass={glassMode}>
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
                {t('settings.glassMode')}
              </AppText>
              <AppText
                variant="caption"
                style={{ color: COLORS.textMuted, marginTop: 2 }}
              >
                {t('settings.glassModeDesc')}
              </AppText>
            </View>
            <Switch
              value={glassMode}
              onValueChange={setGlassMode}
              trackColor={{
                false: COLORS.surfaceMuted,
                true: COLORS.accent,
              }}
              thumbColor={COLORS.textPrimary}
            />
          </View>
        </SettingsGroup>
      </View>
      {}
      <View style={{ gap: 14, marginTop: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AppIcon name="trash" size={16} color={COLORS.textMuted} />
          <AppText
            variant="label"
            weight="medium"
            style={{
              color: COLORS.textSecondary,
              letterSpacing: 1,
              fontSize: 11,
            }}
          >
            {t('settings.localSection').toUpperCase()}
          </AppText>
        </View>

        <SettingsGroup glass={glassMode}>
          <Pressable
            onPress={() => {
              setClearCacheError(null);
              setShowClearCache(true);
            }}
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
              <AppText
                variant="label"
                weight="medium"
                style={{ color: COLORS.danger }}
              >
                {t('settings.clearCache')}
              </AppText>
              <AppText
                variant="caption"
                style={{ color: COLORS.textMuted, marginTop: 2 }}
              >
                {t('settings.clearCacheDesc')}
              </AppText>
            </View>
            <AppIcon name="trash" size={16} color={COLORS.danger} />
          </Pressable>
        </SettingsGroup>
      </View>
      {}
      <View style={{ gap: 14, marginTop: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AppIcon name="download" size={16} color={COLORS.textMuted} />
          <AppText
            variant="label"
            weight="medium"
            style={{
              color: COLORS.textSecondary,
              letterSpacing: 1,
              fontSize: 11,
            }}
          >
            {t('settings.cloudSection').toUpperCase()}
          </AppText>
        </View>

        <SettingsGroup glass={glassMode} style={{ opacity: user ? 1 : 0.4 }}>
          <Pressable
            onPress={user ? () => setShowRestoreLibrary(true) : undefined}
            disabled={!user}
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
                {t('settings.restoreLibrary')}
              </AppText>
              <AppText
                variant="caption"
                style={{ color: COLORS.textMuted, marginTop: 2 }}
              >
                {user
                  ? t('settings.restoreLibraryDesc')
                  : t('settings.cloudRequiresLogin')}
              </AppText>
            </View>
            <AppIcon name="chevron-right" size={16} color={COLORS.textMuted} />
          </Pressable>
        </SettingsGroup>
      </View>
      {}
      <View style={{ gap: 14, marginTop: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AppIcon name="info" size={16} color={COLORS.textMuted} />
          <AppText
            variant="label"
            weight="medium"
            style={{
              color: COLORS.textSecondary,
              letterSpacing: 1,
              fontSize: 11,
            }}
          >
            {t('settings.aboutSection').toUpperCase()}
          </AppText>
        </View>

        <SettingsGroup glass={glassMode}>
          <Pressable
            onPress={openFaq}
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
              {t('settings.faq')}
            </AppText>
            <AppIcon name="chevron-right" size={16} color={COLORS.textMuted} />
          </Pressable>
        </SettingsGroup>
      </View>
      <RestoreLibraryModal
        visible={showRestoreLibrary}
        onClose={() => setShowRestoreLibrary(false)}
      />
      <AppDialog
        visible={showClearCache}
        title={t('settings.clearCacheTitle')}
        message={t('settings.clearCacheMessage')}
        error={clearCacheError}
        confirmLabel={t('settings.clearCacheConfirm')}
        cancelLabel={t('common.cancel')}
        busyLabel={t('settings.clearCacheBusy')}
        busy={clearCacheBusy}
        confirmTone="danger"
        onConfirm={handleClearCache}
        onClose={() => setShowClearCache(false)}
      />
    </ScreenContainer>
  );
}
