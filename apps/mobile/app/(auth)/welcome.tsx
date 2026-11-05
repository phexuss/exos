import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppDialog } from '@/components/AppDialog';
import { Aurora } from '@/components/auth/Aurora';
import { AuthLink } from '@/components/auth/AuthScreen';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { Rise } from '@/components/motion/Rise';
import { AppText } from '@/components/ui/AppText';
import { Wordmark } from '@/components/ui/Wordmark';
import { COLORS } from '@/constants/colors';
import { SOURCES } from '@/constants/sources';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';
import { useAuthStore } from '@/store/useAuthStore';

/** The mark at phone scale (desktop sets it at 120 beside the card). */
const MARK_SIZE = 72;
const SOURCE_LINE = [SOURCES.deezer, SOURCES.soundcloud, SOURCES.youtube]
  .map((s) => s.label)
  .join(' · ');

export default function WelcomeScreen() {
  const { t } = useI18n();
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);

  const confirmOffline = () => {
    setShowOfflineWarning(false);
    useAuthStore.getState().enterOfflineMode();
    router.replace('/(tabs)' as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.ink }}>
      <Aurora />
      <SafeAreaView
        style={{
          flex: 1,
          paddingHorizontal: SPACING.xxl,
          paddingBottom: SPACING.xxl,
        }}
        edges={['top', 'bottom']}
      >
        {/* Desktop `.login__art`: the mark sits low, over the glow. */}
        <View style={{ flex: 1, justifyContent: 'flex-end', gap: 14 }}>
          <Rise index={0}>
            <Wordmark size={MARK_SIZE} />
          </Rise>
          <Rise index={2}>
            <AppText
              variant="body"
              style={{
                color: COLORS.textSecondary,
                fontSize: 18,
                lineHeight: 25,
              }}
            >
              {t('auth.tagline')}
            </AppText>
          </Rise>
          <Rise index={3}>
            <AppText
              variant="caption"
              weight="medium"
              style={{
                color: COLORS.textMuted,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {SOURCE_LINE}
            </AppText>
          </Rise>
        </View>

        <Rise index={4} style={{ gap: 12, marginTop: SPACING.huge }}>
          <PrimaryButton
            label={t('auth.getStarted')}
            onPress={() => router.push('/(auth)/register' as never)}
            arrow
          />
          <PrimaryButton
            label={t('auth.signIn')}
            onPress={() => router.push('/(auth)/login' as never)}
            variant="secondary"
          />
          <AuthLink
            label={t('auth.continueOffline')}
            onPress={() => setShowOfflineWarning(true)}
            align="center"
          />
        </Rise>
      </SafeAreaView>

      <AppDialog
        visible={showOfflineWarning}
        title={t('auth.offlineWarningTitle')}
        message={t('auth.offlineWarningDesc')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.confirm')}
        onClose={() => setShowOfflineWarning(false)}
        onConfirm={confirmOffline}
      />
    </View>
  );
}
