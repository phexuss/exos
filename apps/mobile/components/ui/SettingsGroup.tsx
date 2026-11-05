import type { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';

import { GlassSurface } from '@/components/glass/GlassSurface';
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
 * A block of rows. Glass mode: one tinted card (no live blur, it sits in a
 * scrolling list). Classic: rows under a hairline.
 */
export function SettingsGroup({ glass, style, children }: SettingsGroupProps) {
  if (glass) {
    return (
      <GlassSurface
        blur={false}
        variant="regular"
        style={[{ borderRadius: GROUP_RADIUS }, style]}
        contentStyle={{ paddingHorizontal: 16 }}
      >
        {children}
      </GlassSurface>
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
