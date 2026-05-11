import { Pressable, View } from 'react-native';

import { AnimatedModal } from '@/components/AnimatedModal';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';

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
      backdropStyle={{
        backgroundColor: 'rgba(0,0,0,0.62)',
        paddingHorizontal: 24,
      }}
      contentStyle={{
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        padding: 20,
        gap: 18,
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
          <Pressable
            disabled={busy}
            onPress={handleClose}
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: COLORS.surfaceMuted,
              opacity: busy ? 0.6 : 1,
            }}
          >
            <AppText variant="body" weight="medium">
              {cancelLabel}
            </AppText>
          </Pressable>
        ) : null}
        <Pressable
          disabled={busy}
          onPress={onConfirm}
          style={{
            flex: 1,
            paddingVertical: 13,
            borderRadius: 10,
            alignItems: 'center',
            backgroundColor: isDanger
              ? 'rgba(248, 113, 113, 0.16)'
              : COLORS.textPrimary,
            borderWidth: isDanger ? 0.5 : 0,
            borderColor: 'rgba(248, 113, 113, 0.35)',
            opacity: busy ? 0.6 : 1,
          }}
        >
          <AppText
            variant="body"
            weight="medium"
            style={{ color: isDanger ? COLORS.danger : COLORS.background }}
          >
            {busy && busyLabel ? busyLabel : confirmLabel}
          </AppText>
        </Pressable>
      </View>
    </AnimatedModal>
  );
}
