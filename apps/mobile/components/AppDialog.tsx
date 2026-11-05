import { StyleSheet, View } from 'react-native';

import { AnimatedModal } from '@/components/AnimatedModal';
import { AppText } from '@/components/ui/AppText';
import { PillButton } from '@/components/ui/PillButton';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { SPACING } from '@/constants/spacing';

type DialogTone = 'default' | 'danger';

type AppDialogProps = {
  visible: boolean;
  title: string;
  message?: string | null;
  error?: string | null;
  confirmLabel: string;
  cancelLabel?: string;
  busyLabel?: string;
  confirmTone?: DialogTone;
  busy?: boolean;
  showCancel?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function AppDialog({
  visible,
  title,
  message,
  error,
  confirmLabel,
  cancelLabel,
  busyLabel,
  confirmTone = 'default',
  busy = false,
  showCancel = true,
  onConfirm,
  onClose,
}: AppDialogProps) {
  const isDanger = confirmTone === 'danger';

  const handleClose = () => {
    if (!busy) onClose();
  };

  return (
    <AnimatedModal
      visible={visible}
      onRequestClose={handleClose}
      onBackdropPress={handleClose}
      disableBackdropPress={busy}
      backdropStyle={{ paddingHorizontal: SPACING.xxl }}
      contentStyle={{
        backgroundColor: COLORS.surface,
        borderRadius: GLASS.radius.dialog,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: GLASS.rim,
        padding: SPACING.xxl,
        gap: SPACING.xl,
      }}
    >
      <View style={{ gap: 8 }}>
        <AppText variant="title" weight="bold">
          {title}
        </AppText>
        {message ? (
          <AppText
            variant="body"
            style={{ color: COLORS.textSecondary, lineHeight: 22 }}
          >
            {message}
          </AppText>
        ) : null}
        {error ? (
          <AppText variant="caption" style={{ color: COLORS.danger }}>
            {error}
          </AppText>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {showCancel ? (
          <PillButton
            label={cancelLabel ?? ''}
            tone="quiet"
            disabled={busy}
            onPress={handleClose}
          />
        ) : null}
        <PillButton
          label={busy && busyLabel ? busyLabel : confirmLabel}
          tone={isDanger ? 'danger' : 'accent'}
          disabled={busy}
          onPress={onConfirm}
        />
      </View>
    </AnimatedModal>
  );
}
