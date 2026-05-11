import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { AnimatedModal } from '@/components/AnimatedModal';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
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
  onClose: () => void;
  onSubmit: (value: string) => Promise<void>;
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
  onClose,
  onSubmit,
}: EditFieldModalProps) {
  const { t } = useI18n();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setError(null);
    }
  }, [visible, initialValue]);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === initialValue) {
      onClose();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 16,
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
            error={error}
          />
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
      </KeyboardAvoidingView>
    </AnimatedModal>
  );
}
