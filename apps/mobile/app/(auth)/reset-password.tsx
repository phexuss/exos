import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';

import { AuthLink, AuthNote, AuthScreen } from '@/components/auth/AuthScreen';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
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
    <AuthScreen
      title={t('auth.resetPasswordTitle')}
      subtitle={t('auth.resetPasswordSubtitle')}
      onBack={() => router.back()}
    >
      <AuthTextField
        label={t('auth.newPassword')}
        icon="lock"
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
        icon="lock"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder={t('auth.confirmPasswordPlaceholder')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />
      {error ? <AuthNote tone="error">{error}</AuthNote> : null}
      <PrimaryButton
        label={t('auth.resetPassword')}
        onPress={handleSubmit}
        loading={isLoading}
        arrow
      />
      <AuthLink
        label={t('auth.backToSignIn')}
        onPress={() => router.replace('/(auth)/login' as never)}
      />
    </AuthScreen>
  );
}
