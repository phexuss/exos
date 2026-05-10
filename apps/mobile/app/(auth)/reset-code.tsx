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
              {t('auth.resetCodeTitle')}
            </AppText>
            <AppText
              variant="body"
              style={{ color: COLORS.textSecondary, fontSize: 14 }}
            >
              {t('auth.resetCodeSubtitle')}{' '}
              <AppText
                variant="body"
                weight="bold"
                style={{ color: COLORS.textPrimary, fontSize: 14 }}
              >
                {email}
              </AppText>
            </AppText>
          </View>

          <View style={{ marginTop: SPACING.xxxl, gap: SPACING.lg }}>
            <AuthTextField
              label={t('auth.email')}
              value={email}
              onChangeText={() => undefined}
              editable={false}
            />
            <AuthTextField
              ref={codeRef}
              label={t('auth.resetCode')}
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
              label={t('auth.verifyResetCode')}
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
