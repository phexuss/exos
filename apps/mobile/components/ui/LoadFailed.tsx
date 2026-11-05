import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';

type Props = {
  /** Shown when the thing really does not exist (no error was thrown). */
  message: string;
  /** Set when loading threw: shows "couldn't load" and a retry button. */
  onRetry?: () => void;
  onClose: () => void;
  background: string;
};

/**
 * Empty or failed overlay screen. Always keeps a way out: overlays have no
 * system back on iOS, and a bare "not found" used to be a dead end.
 */
export function LoadFailed({ message, onRetry, onClose, background }: Props) {
  const { t } = useI18n();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }}>
      <ScreenHeader
        leading="close"
        withTopInset={false}
        gutter={SPACING.lg}
        onLeadingPress={onClose}
      />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.md,
          paddingHorizontal: SPACING.lg,
        }}
      >
        <AppText
          variant="body"
          style={{ color: COLORS.textMuted, textAlign: 'center' }}
        >
          {onRetry ? t('common.loadFailed') : message}
        </AppText>
        {onRetry ? (
          <Pressable onPress={onRetry} hitSlop={8} accessibilityRole="button">
            <AppText
              variant="label"
              weight="medium"
              style={{ color: COLORS.accent }}
            >
              {t('common.retry')}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
