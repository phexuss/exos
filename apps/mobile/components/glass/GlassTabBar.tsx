import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/GlassSurface';
import { MiniPlayer } from '@/components/MiniPlayer';
import { TabIcon } from '@/components/TabIcon';
import { GLASS, GLASS_SPRING } from '@/constants/glass';
import { useTabChromeCovered } from '@/hooks/useTabChromeCovered';
import { haptic } from '@/utils/haptics';

export const GLASS_TAB_BAR_HEIGHT = 62;
export const GLASS_TAB_BAR_MARGIN = 10;
const BUBBLE_INSET = 5;
// How much the droplet stretches (and thins) while it is a full tab away.
const BUBBLE_STRETCH_X = 0.3;
const BUBBLE_SQUASH_Y = 0.12;

type GlassTabBarProps = BottomTabBarProps & {
  icons: Record<string, TabGlyph>;
};

type TabGlyph = 'home' | 'search' | 'library';

type GlassTabProps = {
  icon: TabGlyph;
  label?: string;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

function spring(
  value: Animated.Value,
  toValue: number,
  preset: keyof typeof GLASS_SPRING,
) {
  Animated.spring(value, {
    toValue,
    ...GLASS_SPRING[preset],
    useNativeDriver: true,
  }).start();
}

// React Native Animated on the native driver throughout: on Android every
// Reanimated frame commits the whole shadow tree, kept-alive tab screens
// included, so each tab switch got slower the more those screens held.
function GlassTab({
  icon,
  label,
  focused,
  onPress,
  onLongPress,
}: GlassTabProps) {
  const [pressScale] = useState(() => new Animated.Value(1));

  const iconStyle = useMemo(
    () => ({ transform: [{ scale: pressScale }] }),
    [pressScale],
  );

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={focused ? { selected: true } : {}}
      onPressIn={() => {
        spring(pressScale, 0.8, 'press');
        haptic('tap');
      }}
      onPressOut={() => {
        spring(pressScale, 1, 'snappy');
      }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={iconStyle}>
        <TabIcon icon={icon} focused={focused} size={26} />
      </Animated.View>
    </Pressable>
  );
}

/**
 * Floating liquid-glass tab bar. The selection "droplet" stretches while it
 * travels between tabs and settles with a spring, like iOS 26.
 */
export function GlassTabBar({
  state,
  navigation,
  descriptors,
  icons,
}: GlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const covered = useTabChromeCovered();
  const tabCount = state.routes.length;
  // Plain state, not a shared value: the bubble's width only changes on
  // layout, so the animation itself touches transforms alone and never
  // re-runs layout on a frame.
  const [rowWidth, setRowWidth] = useState(0);
  const tabWidth = rowWidth / tabCount;
  const [position] = useState(() => new Animated.Value(state.index));
  const [target] = useState(() => new Animated.Value(state.index));
  const lastTarget = useRef(state.index);

  // Started from the press itself, so the droplet is already moving while
  // React renders (and on first visit mounts) the next screen.
  const moveBubble = useCallback(
    (index: number) => {
      if (lastTarget.current === index) return;
      lastTarget.current = index;
      target.setValue(index);
      spring(position, index, 'snappy');
    },
    [position, target],
  );

  // Navigation that didn't come from a tap (back button, deep links).
  useEffect(() => {
    moveBubble(state.index);
  }, [state.index, moveBubble]);

  // One spring drives everything: the droplet stretches with the distance it
  // still has to travel and relaxes as it lands, instead of a separate
  // stretch animation racing the movement.
  const bubbleStyle = useMemo(() => {
    const last = Math.max(tabCount - 1, 1);
    const away = Animated.subtract(position, target).interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [1, 0, 1],
      extrapolate: 'clamp',
    });
    return {
      transform: [
        {
          translateX: position.interpolate({
            inputRange: [0, last],
            outputRange: [BUBBLE_INSET, last * tabWidth + BUBBLE_INSET],
          }),
        },
        {
          scaleX: away.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1 + BUBBLE_STRETCH_X],
          }),
        },
        {
          scaleY: away.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1 - BUBBLE_SQUASH_Y],
          }),
        },
      ],
    };
  }, [position, target, tabCount, tabWidth]);

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
    >
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
        style={StyleSheet.absoluteFill}
      />
      <MiniPlayer blur={!covered} />
      <GlassSurface
        floating
        variant="regular"
        blur={!covered}
        style={{
          marginHorizontal: 20,
          marginBottom: Math.max(insets.bottom, GLASS_TAB_BAR_MARGIN),
          height: GLASS_TAB_BAR_HEIGHT,
          borderRadius: GLASS.radius.capsule,
        }}
        contentStyle={{ flex: 1 }}
      >
        <View
          style={{ flex: 1, flexDirection: 'row' }}
          onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
        >
          {tabWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  top: BUBBLE_INSET,
                  bottom: BUBBLE_INSET,
                  left: 0,
                  width: tabWidth - BUBBLE_INSET * 2,
                  borderRadius: GLASS.radius.capsule,
                  backgroundColor: GLASS.selection,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: GLASS.rimStrong,
                },
                bubbleStyle,
              ]}
            />
          ) : null}
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            return (
              <GlassTab
                key={route.key}
                icon={icons[route.name] ?? 'home'}
                label={descriptors[route.key]?.options.title}
                focused={focused}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) {
                    moveBubble(index);
                    navigation.navigate(route.name);
                  }
                }}
                onLongPress={() => {
                  navigation.emit({ type: 'tabLongPress', target: route.key });
                }}
              />
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );
}
