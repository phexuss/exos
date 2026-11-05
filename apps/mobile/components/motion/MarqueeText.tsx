import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  type LayoutChangeEvent,
  type TextStyle,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { prefersReducedMotion } from '@/constants/motion';

type MarqueeTextProps = {
  children: string;
  variant?: React.ComponentProps<typeof AppText>['variant'];
  weight?: React.ComponentProps<typeof AppText>['weight'];
  style?: TextStyle;
};

/** Pixels per second while the text scrolls. */
const SPEED = 32;
/** Pause at the start of each pass, before the text moves. */
const PAUSE_MS = 2200;
/** Space between the end of the text and its repeat. */
const GAP = 48;

/**
 * One line of text that, when it doesn't fit, scrolls sideways like
 * Spotify's now-playing title: it rests, glides left until its repeat lands
 * where it started, rests again and goes on. Runs on the native driver, so
 * it costs the JS thread nothing; short titles render as plain text.
 */
export function MarqueeText({ children, style, ...props }: MarqueeTextProps) {
  const base: TextStyle = style ?? {};
  const [boxWidth, setBoxWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const [x] = useState(() => new Animated.Value(0));

  const overflows =
    boxWidth > 0 && textWidth > boxWidth + 1 && !prefersReducedMotion();
  const distance = textWidth + GAP;

  useEffect(() => {
    x.setValue(0);
    if (!overflows) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(PAUSE_MS),
        Animated.timing(x, {
          toValue: -distance,
          duration: (distance / SPEED) * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [overflows, distance, x]);

  const onBox = (e: LayoutChangeEvent) =>
    setBoxWidth(Math.round(e.nativeEvent.layout.width));
  const onText = (e: LayoutChangeEvent) =>
    setTextWidth(Math.ceil(e.nativeEvent.layout.width));

  return (
    <View onLayout={onBox} style={{ overflow: 'hidden' }}>
      {/* Unconstrained copy, only to measure the full one-line width. */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', width: 10000, opacity: 0 }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <AppText
          {...props}
          numberOfLines={1}
          style={[base, { alignSelf: 'flex-start' }]}
          onLayout={onText}
        >
          {children}
        </AppText>
      </View>

      {overflows ? (
        <Animated.View
          style={{
            flexDirection: 'row',
            width: distance + textWidth,
            transform: [{ translateX: x }],
          }}
          accessible
          accessibilityLabel={children}
        >
          <AppText
            {...props}
            numberOfLines={1}
            style={[base, { width: textWidth }]}
          >
            {children}
          </AppText>
          <View style={{ width: GAP }} />
          <AppText
            {...props}
            numberOfLines={1}
            style={[base, { width: textWidth }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {children}
          </AppText>
        </Animated.View>
      ) : (
        <AppText {...props} numberOfLines={1} style={base}>
          {children}
        </AppText>
      )}
    </View>
  );
}
