import { useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { DESKTOP_SPRING } from '@/constants/motion';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /**
   * `primary` — accent pill, the one action on a screen.
   * `secondary` — quiet glass pill next to it.
   */
  variant?: 'primary' | 'secondary';
  /** Trailing arrow that leans forward under the finger (desktop submit). */
  arrow?: boolean;
  /** Leading glyph. */
  icon?: IconName;
};

/** Desktop `.login__submit` height. */
const HEIGHT = 48;
/** How far the arrow leans on press (desktop hover nudge). */
const NUDGE = 4;

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  arrow,
  icon,
}: PrimaryButtonProps) {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;
  const ink = isPrimary ? COLORS.onAccent : COLORS.textPrimary;
  const [lean] = useState(() => new Animated.Value(0));

  const nudge = (to: number) => {
    if (!arrow) return;
    Animated.spring(lean, {
      toValue: to,
      ...DESKTOP_SPRING,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      scaleValue={0.97}
      onPress={() => {
        if (!isDisabled) onPress();
      }}
      onPressIn={() => nudge(NUDGE)}
      onPressOut={() => nudge(0)}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        { opacity: disabled && !loading ? 0.5 : 1 },
      ]}
    >
      <View style={styles.row}>
        {icon && !loading ? (
          <AppIcon name={icon} size={18} color={ink} />
        ) : null}
        <AppText
          variant="body"
          weight="bold"
          style={{ color: ink, fontSize: 15 }}
        >
          {label}
        </AppText>
        {loading ? (
          <ActivityIndicator size="small" color={ink} />
        ) : arrow ? (
          <Animated.View style={{ transform: [{ translateX: lean }] }}>
            <AppIcon name="arrow-right" size={18} color={ink} />
          </Animated.View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: HEIGHT,
    borderRadius: GLASS.radius.capsule,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: COLORS.accent },
  secondary: {
    backgroundColor: COLORS.fill2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS.rimStrong,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
