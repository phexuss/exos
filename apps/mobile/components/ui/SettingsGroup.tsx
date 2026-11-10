import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';

type SettingsGroupProps = {
  glass: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** Corner radius of a settings card in Glass mode. */
export const GROUP_RADIUS = 22;

/**
 * A block of rows. Glass mode: one faintly filled card. Classic: rows under
 * a hairline.
 */
export function SettingsGroup({ glass, style, children }: SettingsGroupProps) {
  if (glass) {
    // Desktop `.group`: a faint white fill with a hairline, no sheen.
    return (
      <View
        style={[
          {
            borderRadius: GROUP_RADIUS,
            paddingHorizontal: 16,
            overflow: 'hidden',
            backgroundColor: COLORS.fill1,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: COLORS.fill2,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      style={[{ borderTopWidth: 0.5, borderTopColor: COLORS.border }, style]}
    >
      {children}
    </View>
  );
}

/** Small uppercase heading over a group. */
export function SectionLabel({
  icon,
  label,
}: {
  icon: IconName;
  label: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <AppIcon name={icon} size={16} color={COLORS.textMuted} />
      <AppText
        variant="label"
        weight="medium"
        style={{ color: COLORS.textSecondary, letterSpacing: 1, fontSize: 11 }}
      >
        {label.toUpperCase()}
      </AppText>
    </View>
  );
}
