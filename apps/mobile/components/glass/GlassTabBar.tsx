import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/GlassSurface';
import { MiniPlayer } from '@/components/MiniPlayer';
import type { IconName } from '@/components/ui/AppIcon';
import { AppIcon } from '@/components/ui/AppIcon';
import { COLORS } from '@/constants/colors';
import { GLASS, GLASS_SPRING } from '@/constants/glass';
import { useTabChromeCovered } from '@/hooks/useTabChromeCovered';

export const GLASS_TAB_BAR_HEIGHT = 62;
export const GLASS_TAB_BAR_MARGIN = 10;
const BUBBLE_INSET = 5;
// How much the droplet stretches (and thins) while it is a full tab away.
const BUBBLE_STRETCH_X = 0.3;
const BUBBLE_SQUASH_Y = 0.12;

type GlassTabBarProps = BottomTabBarProps & {
  icons: Record<string, IconName>;
};

type GlassTabProps = {
  icon: IconName;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

function GlassTab({ icon, focused, onPress, onLongPress }: GlassTabProps) {
  const scale = useSharedValue(focused ? 1 : 0.92);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    scale.set(withSpring(focused ? 1 : 0.92, GLASS_SPRING.snappy));
  }, [focused, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() * pressScale.get() }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      onPressIn={() => {
        pressScale.set(withSpring(0.8, GLASS_SPRING.press));
        Haptics.selectionAsync().catch(() => {});
      }}
      onPressOut={() => {
        pressScale.set(withSpring(1, GLASS_SPRING.snappy));
      }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={iconStyle}>
        <AppIcon
          name={icon}
          size={26}
          color={focused ? COLORS.textPrimary : COLORS.textMuted}
        />
      </Animated.View>
    </Pressable>
  );
}

/**
 * Floating liquid-glass tab bar. The selection "droplet" stretches while it
 * travels between tabs and settles with a spring, like iOS 26.
 */
export function GlassTabBar({ state, navigation, icons }: GlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const covered = useTabChromeCovered();
  const tabCount = state.routes.length;
  // Plain state, not a shared value: the bubble's width only changes on
  // layout, so the animation itself touches transforms alone and never
  // re-runs layout on a frame.
  const [rowWidth, setRowWidth] = useState(0);
  const tabWidth = rowWidth / tabCount;
  const position = useSharedValue(state.index);
  const target = useSharedValue(state.index);
  const lastTarget = useRef(state.index);

  // Started from the press itself, so the droplet is already moving while
  // React renders (and on first visit mounts) the next screen.
  const moveBubble = useCallback(
    (index: number) => {
      if (lastTarget.current === index) return;
      lastTarget.current = index;
      target.set(index);
      position.set(withSpring(index, GLASS_SPRING.snappy));
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
  const bubbleStyle = useAnimatedStyle(() => {
    const away = Math.min(Math.abs(position.get() - target.get()), 1);
    return {
      transform: [
        { translateX: position.get() * tabWidth + BUBBLE_INSET },
        { scaleX: 1 + away * BUBBLE_STRETCH_X },
        { scaleY: 1 - away * BUBBLE_SQUASH_Y },
      ],
    };
  });

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
