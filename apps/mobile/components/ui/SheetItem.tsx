import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';

type SheetItemProps = {
  label: string;
  /** A second, quieter line (a count, a hint). */
  detail?: string;
  icon?: IconName;
  /** Replaces the icon tile, e.g. with a cover. */
  leading?: ReactNode;
  tone?: 'default' | 'accent' | 'danger';
  /** Draws a chevron: the item opens another step. */
  next?: boolean;
  color?: string;
  onPress: () => void;
};

/** Icon tile size and row rhythm, after the desktop context menu. */
export const SHEET_TILE = 40;
const TILE_RADIUS = 12;
const ROW_RADIUS = 14;

const TILE = {
  default: { fill: COLORS.fill2, ink: COLORS.textPrimary },
  accent: { fill: COLORS.accentSubtle, ink: COLORS.accent },
  danger: { fill: COLORS.dangerSoft, ink: COLORS.danger },
} as const;

/**
 * One action in a sheet: a soft icon tile, the label, and a fill that lights
 * under the finger instead of divider lines between rows.
 */
export function SheetItem({
  label,
  detail,
  icon,
  leading,
  tone = 'default',
  next,
  color,
  onPress,
}: SheetItemProps) {
  const { fill, ink } = TILE[tone];
  const text =
    color ?? (tone === 'danger' ? COLORS.danger : COLORS.textPrimary);

  return (
    <AnimatedPressable
      onPress={onPress}
      scaleValue={0.985}
      highlightRadius={ROW_RADIUS}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: ROW_RADIUS,
      }}
    >
      {leading ?? (
        <View
          style={{
            width: SHEET_TILE,
            height: SHEET_TILE,
            borderRadius: TILE_RADIUS,
            backgroundColor: fill,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon ? <AppIcon name={icon} size={20} color={color ?? ink} /> : null}
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText
          variant="body"
          weight="medium"
          numberOfLines={1}
          style={{ color: text, fontSize: 15 }}
        >
          {label}
        </AppText>
        {detail ? (
          <AppText
            variant="caption"
            numberOfLines={1}
            style={{ color: COLORS.textMuted }}
          >
            {detail}
          </AppText>
        ) : null}
      </View>
      {next ? (
        <AppIcon name="chevron-right" size={18} color={COLORS.textMuted} />
      ) : null}
    </AnimatedPressable>
  );
}
