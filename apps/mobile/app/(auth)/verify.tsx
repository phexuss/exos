import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { type TextInput as RNTextInput, TextInput, View } from 'react-native';

import { AuthLink, AuthNote, AuthScreen } from '@/components/auth/AuthScreen';
import { FIELD_RADIUS } from '@/components/auth/AuthTextField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';
import { FONT_FAMILY } from '@/constants/typography';
import { useI18n } from '@/hooks/useI18n';
import { ApiError } from '@/services/api/client';
import { useAuthStore } from '@/store/useAuthStore';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;
/** Taller than a text field: the digits are the whole form. */
const DIGIT_HEIGHT = 56;

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
  const [focusedDigit, setFocusedDigit] = useState<number | null>(null);

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
    <AuthScreen
      title={t('auth.verifyTitle')}
      subtitle={
        <>
          {t('auth.verifySubtitle')}{' '}
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
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {Array.from({ length: CODE_LENGTH }).map((_, i) => (
          <TextInput
            maxFontSizeMultiplier={LAYOUT.maxFontScale}
            // biome-ignore lint/suspicious/noArrayIndexKey: digit position is stable
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={digits[i]}
            onChangeText={(v) => handleDigitChange(i, v)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
            onFocus={() => setFocusedDigit(i)}
            onBlur={() => setFocusedDigit((f) => (f === i ? null : f))}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            textAlign="center"
            selectionColor={COLORS.accent}
            cursorColor={COLORS.accent}
            style={{
              flex: 1,
              height: DIGIT_HEIGHT,
              paddingVertical: 0,
              backgroundColor: focusedDigit === i ? COLORS.fill2 : COLORS.fill1,
              borderWidth: 1,
              borderColor: error
                ? COLORS.danger
                : focusedDigit === i
                  ? COLORS.accent
                  : COLORS.border,
              borderRadius: FIELD_RADIUS,
              fontFamily: FONT_FAMILY.bold,
              fontSize: 22,
              color: COLORS.textPrimary,
            }}
          />
        ))}
      </View>

      {error ? <AuthNote tone="error">{error}</AuthNote> : null}
      {info ? <AuthNote tone="info">{info}</AuthNote> : null}

      <PrimaryButton
        label={t('auth.verify')}
        onPress={() => handleSubmit()}
        loading={isLoading}
        arrow
      />
      <AuthLink
        label={resendLabel}
        onPress={handleResend}
        disabled={secondsLeft > 0}
      />
    </AuthScreen>
  );
}
