import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { COLORS } from '@/constants/colors';
import { GLASS_SPRING } from '@/constants/glass';
import { prefersReducedMotion } from '@/constants/motion';

type TabIconProps = {
  /** Outline glyph; its `-solid` twin shows while the tab is selected. */
  icon: 'home' | 'search' | 'library';
  focused: boolean;
  size: number;
};

/** A resting tab sits a little smaller than the selected one. */
const REST_SCALE = 0.9;

/**
 * A tab's glyph: the outline fades into the filled one and springs up a
 * size when its tab is selected, and back when it is left. Both glyphs stay
 * mounted, so the change is two native-driver values and no re-layout.
 */
export function TabIcon({ icon, focused, size }: TabIconProps) {
  const [on] = useState(() => new Animated.Value(focused ? 1 : 0));

  useEffect(() => {
    if (prefersReducedMotion()) {
      on.setValue(focused ? 1 : 0);
      return;
    }
    const run = Animated.spring(on, {
      toValue: focused ? 1 : 0,
      ...GLASS_SPRING.snappy,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [focused, on]);

  const styles = useMemo(() => {
    const clamp = { extrapolate: 'clamp' as const };
    return {
      box: {
        transform: [
          {
            scale: on.interpolate({
              inputRange: [0, 1],
              outputRange: [REST_SCALE, 1],
            }),
          },
        ],
      },
      outline: {
        opacity: on.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
          ...clamp,
        }),
      },
      solid: {
        opacity: on.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          ...clamp,
        }),
      },
    };
  }, [on]);

  return (
    <Animated.View style={[{ width: size, height: size }, styles.box]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.outline]}>
        <AppIcon name={icon} size={size} color={COLORS.textMuted} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.solid]}>
        <AppIcon
          name={`${icon}-solid` as IconName}
          size={size}
          color={COLORS.textPrimary}
        />
      </Animated.View>
    </Animated.View>
  );
}
