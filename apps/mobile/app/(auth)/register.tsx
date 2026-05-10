import { router } from 'expo-router';
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
              {t('auth.registerTitle')}
            </AppText>
            <AppText
              variant="body"
              style={{ color: COLORS.textSecondary, fontSize: 14 }}
            >
              {t('auth.registerSubtitle')}
            </AppText>
          </View>

          <View style={{ marginTop: SPACING.xxl, gap: SPACING.lg }}>
            <AuthTextField
              label={t('auth.name')}
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
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordPlaceholder')}
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

          <View style={{ marginTop: SPACING.xxl, gap: SPACING.lg }}>
            <PrimaryButton
              label={t('auth.createAccount')}
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
                style={{ color: COLORS.textSecondary, fontSize: 13 }}
              >
                {t('auth.alreadyHaveAccount')}{' '}
                <AppText
                  variant="caption"
                  weight="bold"
                  style={{ color: COLORS.accent, fontSize: 13 }}
                >
                  {t('auth.signIn')}
                </AppText>
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
