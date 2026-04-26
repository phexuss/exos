import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';

export default function WelcomeScreen() {
  const { t } = useI18n();

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
        </View>
      </View>
    </SafeAreaView>
  );
}
