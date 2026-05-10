import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  type TextInput as RNTextInput,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthTextField } from '@/components/auth/AuthTextField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';
import { ApiError } from '@/services/api/client';
import { useAuthStore } from '@/store/useAuthStore';

export default function ResetPasswordScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ resetToken?: string }>();
  const resetToken = params.resetToken ?? '';
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const confirmPasswordRef = useRef<RNTextInput>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!resetToken || !password || !confirmPassword) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    try {
      await resetPassword(resetToken, password);
      router.replace({
        pathname: '/(auth)/login' as never,
        params: { reset: '1' },
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: SPACING.xxl,
            paddingTop: SPACING.lg,
            paddingBottom: SPACING.xxl,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="chevron-right" size={20} color={COLORS.textMuted} />
          </Pressable>

          <View style={{ marginTop: SPACING.xxl, gap: 6 }}>
            <AppText variant="display" weight="bold">
              {t('auth.resetPasswordTitle')}
            </AppText>
            <AppText
              variant="body"
              style={{ color: COLORS.textSecondary, fontSize: 14 }}
            >
              {t('auth.resetPasswordSubtitle')}
            </AppText>
          </View>

          <View style={{ marginTop: SPACING.xxxl, gap: SPACING.lg }}>
            <AuthTextField
              label={t('auth.newPassword')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordPlaceholder')}
              secureTextEntry
              autoComplete="new-password"
              textContentType="password"
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            />
            <AuthTextField
              ref={confirmPasswordRef}
              label={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              secureTextEntry
              autoComplete="new-password"
              textContentType="password"
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
              label={t('auth.resetPassword')}
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
