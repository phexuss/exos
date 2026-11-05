import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnimatedModal } from '@/components/AnimatedModal';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { SPACING } from '@/constants/spacing';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useI18n } from '@/hooks/useI18n';

type EditFieldModalProps = {
  visible: boolean;
  title: string;
  label: string;
  initialValue: string;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  maxLength?: number;
  /** Ask for the current password too (the API requires it for email). */
  requirePassword?: boolean;
  onClose: () => void;
  onSubmit: (value: string, currentPassword?: string) => Promise<void>;
};

export function EditFieldModal({
  visible,
  title,
  label,
  initialValue,
  placeholder,
  keyboardType,
  autoCapitalize = 'none',
  maxLength,
  requirePassword = false,
  onClose,
  onSubmit,
}: EditFieldModalProps) {
  const { t } = useI18n();
  const glassMode = useGlassMode();
  const [value, setValue] = useState(initialValue);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setPassword('');
      setError(null);
    }
  }, [visible, initialValue]);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === initialValue) {
      onClose();
      return;
    }
    if (requirePassword && !password) {
      setError(t('profile.currentPassword'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed, requirePassword ? password : undefined);
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : t('common.error');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedModal
      visible={visible}
      onRequestClose={onClose}
      onBackdropPress={onClose}
      backdropStyle={{ paddingHorizontal: SPACING.xxl }}
    >
      <View>
        <View
          style={{
            // In Glass mode AnimatedModal supplies the frosted surface.
            backgroundColor: glassMode ? 'transparent' : COLORS.surface,
            borderRadius: GLASS.radius.dialog,
            borderWidth: glassMode ? 0 : StyleSheet.hairlineWidth,
            borderColor: GLASS.rim,
            padding: SPACING.xxl,
            gap: SPACING.lg,
          }}
        >
          <AppText variant="title" weight="bold">
            {title}
          </AppText>
          <AuthTextField
            label={label}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            maxLength={maxLength}
            error={requirePassword ? null : error}
          />
          {requirePassword ? (
            <AuthTextField
              label={t('profile.currentPassword')}
              value={password}
              onChangeText={setPassword}
              icon="lock"
              secureTextEntry
              autoComplete="password"
              error={error}
            />
          ) : null}
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label={t('common.cancel')}
                onPress={onClose}
                variant="secondary"
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label={submitting ? t('common.saving') : t('common.save')}
                onPress={handleSubmit}
                loading={submitting}
              />
            </View>
          </View>
        </View>
      </View>
    </AnimatedModal>
  );
}
