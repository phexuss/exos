import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AppDialog } from '@/components/AppDialog';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';
import { useAuthStore } from '@/store/useAuthStore';

export default function WelcomeScreen() {
  const { t } = useI18n();
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);

  const confirmOffline = () => {
    setShowOfflineWarning(false);
    useAuthStore.getState().enterOfflineMode();
    router.replace('/(tabs)' as never);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      edges={['top', 'bottom']}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: SPACING.xxl,
          paddingVertical: SPACING.xxl,
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <AppText
            weight="black"
            style={{
              fontSize: 64,
              lineHeight: 80,
              letterSpacing: 6,
              color: COLORS.accent,
              textAlign: 'center',
              includeFontPadding: false,
            }}
          >
            EXØS
          </AppText>
          <AppText
            variant="body"
            style={{
              color: COLORS.textSecondary,
              textAlign: 'center',
              fontSize: 15,
            }}
          >
            {t('auth.tagline')}
          </AppText>
        </View>

        <View style={{ gap: 12 }}>
          <PrimaryButton
            label={t('auth.getStarted')}
            onPress={() => router.push('/(auth)/register' as never)}
          />
          <PrimaryButton
            label={t('auth.signIn')}
            onPress={() => router.push('/(auth)/login' as never)}
            variant="secondary"
          />
          <AnimatedPressable
            scaleValue={0.97}
            onPress={() => setShowOfflineWarning(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 14,
              borderRadius: 12,
              borderWidth: 0.5,
              borderColor: COLORS.divider,
              backgroundColor: 'rgba(255,255,255,0.03)',
            }}
          >
            <AppIcon name="globe" size={16} color={COLORS.textMuted} />
            <AppText
              variant="body"
              weight="medium"
              style={{ color: COLORS.textMuted, fontSize: 14 }}
            >
              {t('auth.continueOffline')}
            </AppText>
          </AnimatedPressable>
        </View>
      </View>

      <AppDialog
        visible={showOfflineWarning}
        title={t('auth.offlineWarningTitle')}
        message={t('auth.offlineWarningDesc')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.confirm')}
        onClose={() => setShowOfflineWarning(false)}
        onConfirm={confirmOffline}
      />
    </SafeAreaView>
  );
}
