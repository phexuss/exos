import { forwardRef, useState } from 'react';
import {
  Animated,
  Pressable,
  type TextInput as RNTextInput,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { FONT_FAMILY } from '@/constants/typography';
import { useI18n } from '@/hooks/useI18n';

type AuthTextFieldProps = {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  /** Leading glyph, as in the desktop sign-in fields. */
  icon?: IconName;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?:
    | 'off'
    | 'email'
    | 'password'
    | 'username'
    | 'name'
    | 'new-password';
  keyboardType?: 'default' | 'email-address' | 'numeric';
  textContentType?: 'username' | 'password' | 'emailAddress' | 'name' | 'none';
  returnKeyType?: 'next' | 'done' | 'go';
  onSubmitEditing?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  maxLength?: number;
  error?: string | null;
  /** Large, wide-tracked digits for one-time codes. */
  code?: boolean;
  autoFocus?: boolean;
};

/** Desktop `.login__input`: 48 high, radius 14. */
export const FIELD_HEIGHT = 48;
export const FIELD_RADIUS = 14;
/** Width of the soft accent ring around a focused field (desktop 4px). */
const RING = 4;

/**
 * Sign-in field after the desktop one: a quiet fill with a hairline, a
 * leading icon, and on focus an accent edge with a soft ring around it. The
 * ring fades on the native driver; nothing else animates.
 */
export const AuthTextField = forwardRef<RNTextInput, AuthTextFieldProps>(
  function AuthTextField(
    {
      label,
      value,
      onChangeText,
      placeholder,
      icon,
      secureTextEntry,
      autoCapitalize = 'none',
      autoComplete,
      keyboardType = 'default',
      textContentType,
      returnKeyType,
      onSubmitEditing,
      onBlur,
      editable = true,
      maxLength,
      error,
      code,
      autoFocus,
    },
    ref,
  ) {
    const { t } = useI18n();
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(true);
    const [ring] = useState(() => new Animated.Value(0));

    const fadeRing = (to: number) =>
      Animated.timing(ring, {
        toValue: to,
        duration: MOTION.dur.quick,
        useNativeDriver: true,
      }).start();

    const edge = error
      ? COLORS.danger
      : focused
        ? COLORS.accent
        : COLORS.border;
    const glyph = focused ? COLORS.textPrimary : COLORS.textMuted;

    return (
      <View style={{ gap: 8 }}>
        {label ? (
          <AppText
            variant="label"
            weight="medium"
            style={{ color: COLORS.textSecondary, fontSize: 13 }}
          >
            {label}
          </AppText>
        ) : null}
        <View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                borderColor: error ? COLORS.danger : COLORS.accentSubtle,
                opacity: ring,
              },
            ]}
          />
          <View
            style={[
              styles.box,
              {
                borderColor: edge,
                backgroundColor: focused ? COLORS.fill2 : COLORS.fill1,
                opacity: editable ? 1 : 0.6,
              },
            ]}
          >
            {icon ? <AppIcon name={icon} size={18} color={glyph} /> : null}
            <TextInput
              maxFontSizeMultiplier={LAYOUT.maxFontScale}
              ref={ref}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={secureTextEntry && hidden}
              autoCapitalize={autoCapitalize}
              autoComplete={autoComplete}
              autoCorrect={false}
              keyboardType={keyboardType}
              textContentType={textContentType}
              returnKeyType={returnKeyType}
              onSubmitEditing={onSubmitEditing}
              onFocus={() => {
                setFocused(true);
                fadeRing(1);
              }}
              onBlur={() => {
                setFocused(false);
                fadeRing(0);
                onBlur?.();
              }}
              editable={editable}
              maxLength={maxLength}
              autoFocus={autoFocus}
              selectionColor={COLORS.accent}
              cursorColor={COLORS.accent}
              style={[styles.input, code ? styles.code : undefined]}
            />
            {secureTextEntry ? (
              <Pressable
                onPress={() => setHidden((h) => !h)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={
                  hidden ? t('auth.showPassword') : t('auth.hidePassword')
                }
                style={({ pressed }) => [
                  styles.peek,
                  pressed ? { backgroundColor: COLORS.fill2 } : undefined,
                ]}
              >
                <AppIcon
                  name={hidden ? 'eye' : 'eye-closed'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </Pressable>
            ) : null}
          </View>
        </View>
        {error ? (
          <AppText
            variant="caption"
            style={{ color: COLORS.danger, fontSize: 12 }}
          >
            {error}
          </AppText>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: -RING,
    left: -RING,
    right: -RING,
    bottom: -RING,
    borderRadius: FIELD_RADIUS + RING,
    borderWidth: RING,
  },
  box: {
    height: FIELD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: FIELD_RADIUS,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    paddingRight: 8,
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 15,
  },
  code: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 20,
    letterSpacing: 8,
  },
  peek: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
