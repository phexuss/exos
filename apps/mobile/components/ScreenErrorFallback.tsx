import type { ErrorBoundaryProps } from 'expo-router';
import { SplashScreen } from 'expo-router';
import { useContext, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { DEFAULT_LOCALE } from '@/constants/i18n';
import { getTranslation, type TranslationPath } from '@/i18n';
import { LanguageContext } from '@/providers/LanguageProvider';

/**
 * Rendered by Expo Router in place of a route that threw while rendering, so
 * one broken screen shows a retry button instead of taking the app down.
 * Plain <Text>: fonts or the language provider may be what failed.
 */
export function ScreenErrorFallback({ error, retry }: ErrorBoundaryProps) {
  const language = useContext(LanguageContext);
  const t = (key: TranslationPath) =>
    language ? language.t(key) : getTranslation(DEFAULT_LOCALE, key);

  useEffect(() => {
    console.error('[ErrorBoundary]', error);
    // The root layout may have thrown before it hid the splash screen.
    SplashScreen.hideAsync().catch(() => {});
  }, [error]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 32,
        backgroundColor: COLORS.background,
      }}
    >
      <Text
        style={{ color: COLORS.textPrimary, fontSize: 17, textAlign: 'center' }}
      >
        {t('common.error')}
      </Text>
      {__DEV__ ? (
        <Text
          style={{ color: COLORS.textMuted, fontSize: 12, textAlign: 'center' }}
          numberOfLines={6}
        >
          {error.message}
        </Text>
      ) : null}
      <Pressable
        onPress={retry}
        hitSlop={12}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 999,
          backgroundColor: COLORS.surfaceMuted,
        }}
      >
        <Text style={{ color: COLORS.textPrimary, fontSize: 15 }}>
          {t('common.retry')}
        </Text>
      </Pressable>
    </View>
  );
}
