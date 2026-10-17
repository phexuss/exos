import type { ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { AppIcon } from '@/components/ui/AppIcon';
import { COLORS } from '@/constants/colors';
import { GLASS, type GlassVariant } from '@/constants/glass';

type GlassIconButtonProps = {
  icon: ComponentProps<typeof AppIcon>['name'];
  onPress: () => void;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  variant?: GlassVariant;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Round frosted button — header actions, player chrome. */
export function GlassIconButton({
  icon,
  onPress,
  size = 40,
  iconSize = 20,
  iconColor = COLORS.textPrimary,
  variant = 'thin',
  style,
  accessibilityLabel,
}: GlassIconButtonProps) {
  return (
    <AnimatedPressable
      scaleValue={0.86}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      <GlassSurface
        variant={variant}
        style={{
          width: size,
          height: size,
          borderRadius: GLASS.radius.capsule,
        }}
        contentStyle={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppIcon name={icon} size={iconSize} color={iconColor} />
      </GlassSurface>
    </AnimatedPressable>
  );
}
