import { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { prefersReducedMotion, SHEET_SPRING } from '@/constants/motion';
import { haptic } from '@/utils/haptics';

const PAD = 4;
const HEIGHT = 40;

type SegmentedProps<T extends string> = {
  options: readonly { key: T; label: string }[];
  /** `null`: none of the options is on (a custom value). */
  value: T | null;
  onChange: (key: T) => void;
  /** Ink of the selected label; white when left out. */
  accentColor?: string;
};

/**
 * A row of mutually exclusive choices with one thumb that slides to the
 * chosen one. The thumb moves on the native driver; labels keep one weight
 * and take the whole segment, so nothing is re-measured when the choice
 * changes (a label that switched to bold used to lose its last letter).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accentColor,
}: SegmentedProps<T>) {
  const [width, setWidth] = useState(0);
  const index = options.findIndex((o) => o.key === value);
  const segment = width > 0 ? (width - PAD * 2) / options.length : 0;
  const [x] = useState(() => new Animated.Value(0));
  const [shown] = useState(() => new Animated.Value(index >= 0 ? 1 : 0));
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    if (segment === 0) return;
    const to = Math.max(index, 0) * segment;
    // First layout, or nothing was selected: appear in place, don't travel.
    if (!placed || index < 0 || prefersReducedMotion()) {
      if (index >= 0) x.setValue(to);
      shown.setValue(index >= 0 ? 1 : 0);
      setPlaced(true);
      return;
    }
    shown.setValue(1);
    const run = Animated.spring(x, {
      toValue: to,
      ...SHEET_SPRING,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [index, segment, placed, x, shown]);

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        height: HEIGHT + PAD * 2,
        padding: PAD,
        borderRadius: GLASS.radius.capsule,
        backgroundColor: COLORS.fill2,
      }}
    >
      {segment > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: PAD,
            left: PAD,
            width: segment,
            height: HEIGHT,
            borderRadius: GLASS.radius.capsule,
            backgroundColor: 'rgba(255,255,255,0.14)',
            borderWidth: 1,
            borderColor: GLASS.rim,
            opacity: shown,
            transform: [{ translateX: x }],
          }}
        />
      ) : null}
      {options.map((option) => {
        const on = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => {
              if (on) return;
              haptic('tick');
              onChange(option.key);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              height: HEIGHT,
              justifyContent: 'center',
              paddingHorizontal: 6,
            }}
          >
            <AppText
              variant="label"
              weight="bold"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={{
                alignSelf: 'stretch',
                textAlign: 'center',
                color: on
                  ? (accentColor ?? COLORS.textPrimary)
                  : COLORS.textSecondary,
              }}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
