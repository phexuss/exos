import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { TextInput as RNTextInput } from 'react-native';

import { AppDialog } from '@/components/AppDialog';
import { AuthLink, AuthNote, AuthScreen } from '@/components/auth/AuthScreen';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { useI18n } from '@/hooks/useI18n';
import { ApiError } from '@/services/api/client';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ reset?: string }>();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);

  const passwordRef = useRef<RNTextInput>(null);

  useEffect(() => {
    if (params.reset === '1') {
      setInfo(t('auth.passwordResetDone'));
    }
  }, [params.reset, t]);

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);
    if (!username.trim() || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }

    try {
      await login(username.trim(), password);
      router.replace('/(tabs)' as never);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          setError(t('auth.invalidCredentials'));
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

  const goOffline = () => {
    setShowOfflineWarning(false);
    useAuthStore.getState().enterOfflineMode();
    router.replace('/(tabs)' as never);
  };

  return (
    <>
      <AuthScreen
        title={t('auth.welcomeBack')}
        subtitle={t('auth.welcomeSubtitle')}
        onBack={router.canGoBack() ? () => router.back() : undefined}
        after={
          <AuthLink
            label={t('auth.orContinueOffline')}
            onPress={() => setShowOfflineWarning(true)}
            align="center"
          />
        }
      >
        <AuthTextField
          label={t('auth.username')}
          icon="profile"
          value={username}
          onChangeText={setUsername}
          placeholder={t('auth.usernamePlaceholder')}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          maxLength={36}
        />
        <AuthTextField
          ref={passwordRef}
          label={t('auth.password')}
          icon="lock"
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.passwordPlaceholder')}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
        <AuthLink
          label={t('auth.forgotPassword')}
          onPress={() => router.push('/(auth)/forgot-password' as never)}
          align="flex-end"
        />
        {error ? <AuthNote tone="error">{error}</AuthNote> : null}
        {info ? <AuthNote tone="info">{info}</AuthNote> : null}
        <PrimaryButton
          label={t('auth.signIn')}
          onPress={handleSubmit}
          loading={isLoading}
          arrow
        />
        <AuthLink
          prefix={t('auth.dontHaveAccount')}
          label={t('auth.signUp')}
          onPress={() => router.replace('/(auth)/register' as never)}
        />
      </AuthScreen>

      <AppDialog
        visible={showOfflineWarning}
        title={t('auth.offlineWarningTitle')}
        message={t('auth.offlineWarningDesc')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.confirm')}
        onClose={() => setShowOfflineWarning(false)}
        onConfirm={goOffline}
      />
    </>
  );
}
