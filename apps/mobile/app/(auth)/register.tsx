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

export default function RegisterScreen() {
  const { t } = useI18n();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const usernameRef = useRef<RNTextInput>(null);
  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);

  const handleSubmit = async () => {
    setError(null);
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedUsername || !trimmedEmail || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError(t('auth.invalidEmail'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    try {
      const { userId, email: registeredEmail } = await register(
        trimmedName,
        trimmedUsername,
        trimmedEmail,
        password,
      );
      router.replace({
        pathname: '/(auth)/verify' as never,
        params: { userId, email: registeredEmail },
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
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      onBack={() => router.back()}
    >
      <AuthTextField
        label={t('auth.name')}
        icon="id"
        value={name}
        onChangeText={setName}
        placeholder={t('auth.namePlaceholder')}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => usernameRef.current?.focus()}
        maxLength={16}
      />
      <AuthTextField
        ref={usernameRef}
        label={t('auth.username')}
        icon="profile"
        value={username}
        onChangeText={setUsername}
        placeholder={t('auth.usernamePlaceholder')}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        maxLength={36}
      />
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
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AuthTextField
        ref={passwordRef}
        label={t('auth.password')}
        icon="lock"
        value={password}
        onChangeText={setPassword}
        placeholder={t('auth.passwordPlaceholder')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />
      {error ? <AuthNote tone="error">{error}</AuthNote> : null}
      <PrimaryButton
        label={t('auth.createAccount')}
        onPress={handleSubmit}
        loading={isLoading}
        arrow
      />
      <AuthLink
        prefix={t('auth.alreadyHaveAccount')}
        label={t('auth.signIn')}
        onPress={() => router.replace('/(auth)/login' as never)}
      />
    </AuthScreen>
  );
}
