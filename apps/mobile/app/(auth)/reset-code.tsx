import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';

import { AuthLink, AuthNote, AuthScreen } from '@/components/auth/AuthScreen';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { useI18n } from '@/hooks/useI18n';
import { ApiError } from '@/services/api/client';
import { useAuthStore } from '@/store/useAuthStore';

const CODE_LENGTH = 6;

export default function ResetCodeScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? '';
  const verifyPasswordResetCode = useAuthStore(
    (s) => s.verifyPasswordResetCode,
  );
  const isLoading = useAuthStore((s) => s.isLoading);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const codeRef = useRef<RNTextInput>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!email || code.length !== CODE_LENGTH) {
      setError(t('auth.fillAllFields'));
      return;
    }

    try {
      const resetToken = await verifyPasswordResetCode(email, code);
      router.push({
        pathname: '/(auth)/reset-password' as never,
        params: { resetToken },
      } as never);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          setError(t('auth.invalidCode'));
        } else if (e.status === 429) {
          setError(t('auth.tooManyRequests'));
        } else {
          setError(e.message || t('auth.networkError'));
        }
      } else {
        setError(t('auth.networkError'));
      }
    }
  };

  return (
    <AuthScreen
      title={t('auth.resetCodeTitle')}
      subtitle={
        <>
          {t('auth.resetCodeSubtitle')}{' '}
          <AppText
            variant="body"
            weight="bold"
            style={{ color: COLORS.textPrimary, fontSize: 14 }}
          >
            {email}
          </AppText>
        </>
      }
      onBack={() => router.back()}
    >
      <AuthTextField
        ref={codeRef}
        label={t('auth.resetCode')}
        icon="key"
        value={code}
        onChangeText={(value) =>
          setCode(value.replace(/\D/g, '').slice(0, CODE_LENGTH))
        }
        placeholder={t('auth.resetCodePlaceholder')}
        keyboardType="numeric"
        textContentType="none"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        maxLength={CODE_LENGTH}
        code
      />
      {error ? <AuthNote tone="error">{error}</AuthNote> : null}
      <PrimaryButton
        label={t('auth.verifyResetCode')}
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
