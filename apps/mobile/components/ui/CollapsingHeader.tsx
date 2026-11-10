import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { LAYOUT } from '@/constants/layout';
import { EASE_OUT, MOTION, prefersReducedMotion } from '@/constants/motion';
import { useGlassMode } from '@/hooks/useGlassMode';

/** How far the compact title travels up into place. */
const TITLE_SHIFT = 6;

/**
 * Drives a `CollapsingHeader`: pass `onScroll` to the page's scroll view
 * (with `scrollEventThrottle={16}`) and `shown` to the header.
 *
 * The bar is not tied to the scroll position frame by frame. It fades in
 * once, on the native driver, when the page's own large title has scrolled
 * `threshold` away, and out again on the way back: no value crosses from
 * the JS thread per frame, so a busy list cannot make the header stutter.
 */
export function useCollapsingHeader(threshold = 44) {
  const [shown] = useState(() => new Animated.Value(0));
  const past = useRef(false);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = e.nativeEvent.contentOffset.y > threshold;
      if (next === past.current) return;
      past.current = next;
      Animated.timing(shown, {
        toValue: next ? 1 : 0,
        duration: prefersReducedMotion() ? 0 : MOTION.dur.quick,
        easing: EASE_OUT,
        useNativeDriver: true,
      }).start();
    },
    [shown, threshold],
  );

  return { shown, onScroll };
}

type CollapsingHeaderProps = {
  title?: string;
  shown: Animated.Value;
  /** Always visible, whatever the scroll position: back, close. */
  leading?: ReactNode;
  trailing?: ReactNode;
};

/**
 * The bar a page grows once its large title has scrolled away: a frosted
 * strip under the status bar with the title small and centred, like the
 * navigation bar of the iOS music apps. Buttons in its slots are there from
 * the start; only the strip and the title fade.
 *
 * Absolutely positioned over the top of its parent; the page pads its
 * content by `collapsingHeaderHeight()` when it has buttons to clear.
 */
export function CollapsingHeader({
  title,
  shown,
  leading,
  trailing,
}: CollapsingHeaderProps) {
  const insets = useSafeAreaInsets();
  const glassMode = useGlassMode();

  const styles = useMemo(
    () => ({
      strip: { opacity: shown },
      title: {
        opacity: shown,
        transform: [
          {
            translateY: shown.interpolate({
              inputRange: [0, 1],
              outputRange: [TITLE_SHIFT, 0],
            }),
          },
        ],
      },
    }),
    [shown],
  );

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 5,
        height: insets.top + LAYOUT.headerHeight,
        paddingTop: insets.top,
        paddingHorizontal: LAYOUT.gutter,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: glassMode
              ? GLASS.tintDense.thick
              : 'rgba(18,18,18,0.96)',
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: COLORS.divider,
          },
          styles.strip,
        ]}
      />
      <View style={{ width: LAYOUT.iconButton, alignItems: 'flex-start' }}>
        {leading}
      </View>
      <Animated.View
        pointerEvents="none"
        style={[{ flex: 1, alignItems: 'center' }, styles.title]}
      >
        {title ? (
          <AppText variant="body" weight="bold" numberOfLines={1}>
            {title}
          </AppText>
        ) : null}
      </Animated.View>
      <View style={{ width: LAYOUT.iconButton, alignItems: 'flex-end' }}>
        {trailing}
      </View>
    </View>
  );
}
