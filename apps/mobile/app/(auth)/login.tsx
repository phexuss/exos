import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

export default function LoginScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ reset?: string }>();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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
              {t('auth.welcomeBack')}
            </AppText>
            <AppText
              variant="body"
              style={{ color: COLORS.textSecondary, fontSize: 14 }}
            >
              {t('auth.welcomeSubtitle')}
            </AppText>
          </View>

          <View style={{ marginTop: SPACING.xxxl, gap: SPACING.lg }}>
            <AuthTextField
              label={t('auth.username')}
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
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordPlaceholder')}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />
            <Pressable
              onPress={() => router.push('/(auth)/forgot-password' as never)}
              hitSlop={8}
              style={{ alignSelf: 'flex-end', paddingVertical: 2 }}
            >
              <AppText
                variant="caption"
                weight="medium"
                style={{ color: COLORS.accent, fontSize: 13 }}
              >
                {t('auth.forgotPassword')}
              </AppText>
            </Pressable>
            {error ? (
              <AppText
                variant="caption"
                style={{ color: COLORS.danger, fontSize: 12 }}
              >
                {error}
              </AppText>
            ) : null}
            {info ? (
              <AppText
                variant="caption"
                style={{ color: COLORS.accent, fontSize: 12 }}
              >
                {info}
              </AppText>
            ) : null}
          </View>

          <View style={{ marginTop: SPACING.xxxl, gap: SPACING.lg }}>
            <PrimaryButton
              label={t('auth.signIn')}
              onPress={handleSubmit}
              loading={isLoading}
            />
            <Pressable
              onPress={() => router.replace('/(auth)/register' as never)}
              hitSlop={8}
              style={{ alignItems: 'center', paddingVertical: 8 }}
            >
              <AppText
                variant="caption"
                style={{ color: COLORS.textSecondary, fontSize: 13 }}
              >
                {t('auth.dontHaveAccount')}{' '}
                <AppText
                  variant="caption"
                  weight="bold"
                  style={{ color: COLORS.accent, fontSize: 13 }}
                >
                  {t('auth.signUp')}
                </AppText>
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
