import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  type TextInput as RNTextInput,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { FONT_FAMILY } from '@/constants/typography';
import { useI18n } from '@/hooks/useI18n';
import { ApiError } from '@/services/api/client';
import { useAuthStore } from '@/store/useAuthStore';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ userId: string; email: string }>();
  const userId = params.userId ?? '';
  const email = params.email ?? '';

  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const resendCode = useAuthStore((s) => s.resendCode);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [digits, setDigits] = useState<string[]>(() =>
    Array(CODE_LENGTH).fill(''),
  );
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN);

  const inputs = useRef<Array<RNTextInput | null>>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const handleDigitChange = (index: number, value: string) => {
    setError(null);
    setInfo(null);
    // Allow paste of the whole code
    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    if (digitsOnly.length >= CODE_LENGTH) {
      const filled = digitsOnly.slice(0, CODE_LENGTH).split('');
      setDigits(filled);
      inputs.current[CODE_LENGTH - 1]?.focus();
      handleSubmit(filled.join(''));
      return;
    }

    const next = [...digits];
    next[index] = digitsOnly[0];
    setDigits(next);
    if (index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (next.every((d) => d.length === 1)) {
      handleSubmit(next.join(''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
    }
  };

  const handleSubmit = async (overrideCode?: string) => {
    const code = overrideCode ?? digits.join('');
    if (code.length !== CODE_LENGTH) {
      setError(t('auth.invalidCode'));
      return;
    }
    setError(null);
    try {
      await verifyEmail(userId, code);
      router.replace('/(tabs)' as never);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(
          e.status === 429
            ? t('auth.tooManyRequests')
            : e.message || t('auth.invalidCode'),
        );
      } else {
        setError(t('auth.networkError'));
      }
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    setError(null);
    setInfo(null);
    try {
      await resendCode(userId);
      setSecondsLeft(RESEND_COOLDOWN);
      setInfo(t('auth.codeResent'));
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

  const resendLabel =
    secondsLeft > 0
      ? t('auth.resendIn').replace('{seconds}', String(secondsLeft))
      : t('auth.resendCode');

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
              {t('auth.verifyTitle')}
            </AppText>
            <AppText
              variant="body"
              style={{ color: COLORS.textSecondary, fontSize: 14 }}
            >
              {t('auth.verifySubtitle')}{' '}
              <AppText
                variant="body"
                weight="bold"
                style={{ color: COLORS.textPrimary, fontSize: 14 }}
              >
                {email}
              </AppText>
            </AppText>
          </View>

          <View
            style={{
              marginTop: SPACING.xxxl,
              flexDirection: 'row',
              gap: 8,
              justifyContent: 'space-between',
            }}
          >
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <TextInput
                // biome-ignore lint/suspicious/noArrayIndexKey: digit position is stable
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={digits[i]}
                onChangeText={(v) => handleDigitChange(i, v)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(i, nativeEvent.key)
                }
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
                textAlign="center"
                style={{
                  flex: 1,
                  height: 56,
                  backgroundColor: COLORS.surface,
                  borderWidth: 1,
                  borderColor: error ? COLORS.danger : COLORS.border,
                  borderRadius: 12,
                  fontFamily: FONT_FAMILY.bold,
                  fontSize: 22,
                  color: COLORS.textPrimary,
                }}
              />
            ))}
          </View>

          {error ? (
            <AppText
              variant="caption"
              style={{
                color: COLORS.danger,
                fontSize: 12,
                marginTop: SPACING.md,
              }}
            >
              {error}
            </AppText>
          ) : null}
          {info ? (
            <AppText
              variant="caption"
              style={{
                color: COLORS.accent,
                fontSize: 12,
                marginTop: SPACING.md,
              }}
            >
              {info}
            </AppText>
          ) : null}

          <View style={{ marginTop: SPACING.xxl, gap: SPACING.md }}>
            <PrimaryButton
              label={t('auth.verify')}
              onPress={() => handleSubmit()}
              loading={isLoading}
            />
            <Pressable
              onPress={handleResend}
              disabled={secondsLeft > 0}
              hitSlop={8}
              style={{
                alignItems: 'center',
                paddingVertical: 8,
                opacity: secondsLeft > 0 ? 0.5 : 1,
              }}
            >
              <AppText
                variant="caption"
                weight="medium"
                style={{
                  color: secondsLeft > 0 ? COLORS.textMuted : COLORS.accent,
                  fontSize: 13,
                }}
              >
                {resendLabel}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
