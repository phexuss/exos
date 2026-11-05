import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';

import { AuthLink, AuthNote, AuthScreen } from '@/components/auth/AuthScreen';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
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
    <AuthScreen
      title={t('auth.forgotPasswordTitle')}
      subtitle={t('auth.forgotPasswordSubtitle')}
      onBack={() => router.back()}
    >
      <AuthTextField
        ref={emailRef}
        label={t('auth.email')}
        icon="mail"
        value={email}
        onChangeText={setEmail}
        placeholder={t('auth.emailPlaceholder')}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />
      {error ? <AuthNote tone="error">{error}</AuthNote> : null}
      <PrimaryButton
        label={t('auth.sendResetCode')}
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
