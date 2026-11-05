import { StyleSheet } from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { SPACING } from '@/constants/spacing';

const BUTTON_TONES = {
  quiet: {
    backgroundColor: COLORS.fill2,
    borderColor: GLASS.rim,
    color: COLORS.textPrimary,
  },
  accent: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
    color: COLORS.onAccent,
  },
  danger: {
    backgroundColor: COLORS.dangerSoft,
    borderColor: COLORS.dangerRim,
    color: COLORS.danger,
  },
} as const;

/**
 * Desktop dialog button: a pill, quiet, accent or destructive. Pairs share a
 * row and split it evenly.
 */
export function PillButton({
  label,
  tone,
  disabled,
  onPress,
  fill = true,
}: {
  label: string;
  tone: keyof typeof BUTTON_TONES;
  disabled?: boolean;
  onPress: () => void;
  /** Takes an even share of its row. Off: hugs the label, centred. */
  fill?: boolean;
}) {
  const { color, ...surface } = BUTTON_TONES[tone];
  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      scaleValue={0.96}
      accessibilityRole="button"
      style={[
        {
          height: 46,
          borderRadius: GLASS.radius.capsule,
          borderWidth: StyleSheet.hairlineWidth,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.6 : 1,
        },
        fill
          ? { flex: 1 }
          : { alignSelf: 'center', paddingHorizontal: SPACING.xxl },
        surface,
      ]}
    >
      <AppText variant="body" weight="bold" style={{ color, fontSize: 15 }}>
        {label}
      </AppText>
    </AnimatedPressable>
  );
}
