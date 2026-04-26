import { forwardRef } from 'react';
import { type TextInput as RNTextInput, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { FONT_FAMILY } from '@/constants/typography';

type AuthTextFieldProps = {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
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
};

export const AuthTextField = forwardRef<RNTextInput, AuthTextFieldProps>(
  function AuthTextField(
    {
      label,
      value,
      onChangeText,
      placeholder,
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
    },
    ref,
  ) {
    return (
      <View style={{ gap: 6 }}>
        {label ? (
          <AppText
            variant="caption"
            weight="medium"
            style={{ color: COLORS.textSecondary, fontSize: 12 }}
          >
            {label}
          </AppText>
        ) : null}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          keyboardType={keyboardType}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onBlur={() => onBlur?.()}
          editable={editable}
          maxLength={maxLength}
          style={{
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: error ? COLORS.danger : COLORS.border,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            color: COLORS.textPrimary,
            fontFamily: FONT_FAMILY.regular,
            fontSize: 15,
          }}
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
    );
  },
);
