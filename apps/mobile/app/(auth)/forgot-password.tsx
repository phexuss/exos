import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  type TextInput as RNTextInput,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthTextField } from '@/components/auth/AuthTextField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';
import { ApiError } from '@/services/api/client';
import { useAuthStore } from '@/store/useAuthStore';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const { t } = useI18n();
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const emailRef = useRef<RNTextInput>(null);

  const handleSubmit = async () => {
    setError(null);
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    try {
      await forgotPassword(trimmedEmail);
      router.push({
        pathname: '/(auth)/reset-code' as never,
        params: { email: trimmedEmail },
      } as never);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(
          e.status === 429
            ? t('auth.tooManyRequests')
            : e.message || t('auth.networkError'),
        );
      } else {
        setError(t('auth.networkError'));
      }
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: SPACING.xxl,
            paddingTop: SPACING.lg,
            paddingBottom: SPACING.xxl,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <HeaderIconButton
            icon="chevron-left"
            onPress={() => router.back()}
            accessibilityLabel={t('common.back')}
          />

          <View style={{ marginTop: SPACING.xxl, gap: 6 }}>
            <AppText variant="display" weight="bold">
              {t('auth.forgotPasswordTitle')}
            </AppText>
            <AppText
              variant="body"
              style={{ color: COLORS.textSecondary, fontSize: 14 }}
            >
              {t('auth.forgotPasswordSubtitle')}
            </AppText>
          </View>

          <View style={{ marginTop: SPACING.xxxl, gap: SPACING.lg }}>
            <AuthTextField
              ref={emailRef}
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />
            {error ? (
              <AppText
                variant="caption"
                style={{ color: COLORS.danger, fontSize: 12 }}
              >
                {error}
              </AppText>
            ) : null}
          </View>

          <View style={{ marginTop: SPACING.xxxl, gap: SPACING.lg }}>
            <PrimaryButton
              label={t('auth.sendResetCode')}
              onPress={handleSubmit}
              loading={isLoading}
            />
            <Pressable
              onPress={() => router.replace('/(auth)/login' as never)}
              hitSlop={8}
              style={{ alignItems: 'center', paddingVertical: 8 }}
            >
              <AppText
                variant="caption"
                weight="medium"
                style={{ color: COLORS.accent, fontSize: 13 }}
              >
                {t('auth.backToSignIn')}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
