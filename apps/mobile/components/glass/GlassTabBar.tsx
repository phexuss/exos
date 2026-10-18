import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
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
    scale.value = withSpring(focused ? 1 : 0.92, GLASS_SPRING.snappy);
  }, [focused, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pressScale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      onPressIn={() => {
        pressScale.value = withSpring(0.8, GLASS_SPRING.press);
        Haptics.selectionAsync().catch(() => {});
      }}
      onPressOut={() => {
        pressScale.value = withSpring(1, GLASS_SPRING.snappy);
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
  const rowWidth = useSharedValue(0);
  const position = useSharedValue(state.index);
  const stretch = useSharedValue(1);

  useEffect(() => {
    position.value = withSpring(state.index, GLASS_SPRING.snappy);
    stretch.value = withSequence(
      withTiming(1.35, { duration: 110 }),
      withSpring(1, GLASS_SPRING.snappy),
    );
  }, [state.index, position, stretch]);

  const bubbleStyle = useAnimatedStyle(() => {
    const tabWidth = rowWidth.value / tabCount;
    return {
      opacity: rowWidth.value > 0 ? 1 : 0,
      width: Math.max(0, tabWidth - BUBBLE_INSET * 2),
      transform: [
        { translateX: position.value * tabWidth + BUBBLE_INSET },
        { scaleX: stretch.value },
        { scaleY: 1 - (stretch.value - 1) * 0.4 },
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
          onLayout={(e) => {
            rowWidth.value = e.nativeEvent.layout.width;
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: BUBBLE_INSET,
                bottom: BUBBLE_INSET,
                left: 0,
                borderRadius: GLASS.radius.capsule,
                backgroundColor: GLASS.selection,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: GLASS.rimStrong,
              },
              bubbleStyle,
            ]}
          />
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
