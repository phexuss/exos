import type { StyleProp, ViewStyle } from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GlassIconButton } from '@/components/glass/GlassIconButton';
import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { COLORS } from '@/constants/colors';
import { LAYOUT, touchSlop } from '@/constants/layout';
import { useGlassMode } from '@/hooks/useGlassMode';

type HeaderIconButtonProps = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  /**
   * `surface` — default round button on the app background.
   * `overlay` — dark translucent, for buttons floating over images.
   */
  tone?: 'surface' | 'overlay';
  style?: StyleProp<ViewStyle>;
};

const SIZE = LAYOUT.iconButton;

/** The one round icon button used in every header. */
export function HeaderIconButton({
  icon,
  onPress,
  accessibilityLabel,
  tone = 'surface',
  style,
}: HeaderIconButtonProps) {
  const glassMode = useGlassMode();

  if (glassMode) {
    return (
      <GlassIconButton
        icon={icon}
        onPress={onPress}
        size={SIZE}
        iconSize={20}
        accessibilityLabel={accessibilityLabel}
        style={style}
      />
    );
  }

  return (
    <AnimatedPressable
      scaleValue={0.9}
      onPress={onPress}
      hitSlop={touchSlop(SIZE)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            tone === 'overlay' ? 'rgba(0,0,0,0.45)' : COLORS.surfaceMuted,
          borderWidth: tone === 'overlay' ? 0 : 0.5,
          borderColor: COLORS.border,
        },
        style,
      ]}
    >
      <AppIcon
        name={icon}
        size={20}
        color={tone === 'overlay' ? COLORS.textPrimary : COLORS.textSecondary}
      />
    </AnimatedPressable>
  );
}
