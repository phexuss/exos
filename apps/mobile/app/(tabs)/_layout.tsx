import type {
  BottomTabBarProps,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GlassTabBar } from '@/components/glass/GlassTabBar';
import { MiniPlayer } from '@/components/MiniPlayer';
import type { IconName } from '@/components/ui/AppIcon';
import { AppIcon } from '@/components/ui/AppIcon';
import { COLORS } from '@/constants/colors';
import { DESKTOP_SPRING, MOTION } from '@/constants/motion';
import { useGlassMode } from '@/hooks/useGlassMode';

// A screen that throws while rendering shows a retry button here instead of
// unmounting the whole app (the player and overlays stay up).
export { ScreenErrorFallback as ErrorBoundary } from '@/components/ScreenErrorFallback';

const TAB_ICONS: Record<string, IconName> = {
  index: 'home',
  search: 'search',
  library: 'library',
};

/**
 * Desktop `route-in`: the next screen slides in from the side you travel
 * towards while the old one leaves the other way, both fading. Progress is
 * -1/0/1 for tabs left of/at/right of the active one, so the direction
 * comes for free.
 */
const routeSlide: NonNullable<
  BottomTabNavigationOptions['sceneStyleInterpolator']
> = ({ current }) => ({
  sceneStyle: {
    opacity: current.progress.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-MOTION.routeShift, 0, MOTION.routeShift],
        }),
      },
    ],
  },
});

const routeSpring: NonNullable<BottomTabNavigationOptions['transitionSpec']> = {
  animation: 'spring',
  config: { ...DESKTOP_SPRING, overshootClamping: false },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ backgroundColor: COLORS.background }}>
      <MiniPlayer />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingTop: 10,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          borderTopWidth: 0.5,
          borderTopColor: COLORS.border,
        }}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const iconName = TAB_ICONS[route.name] ?? 'home';

          return (
            <AnimatedPressable
              key={route.key}
              scaleValue={0.85}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPressIn={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
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
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
              }}
            >
              <AppIcon
                name={iconName}
                size={28}
                color={focused ? COLORS.textPrimary : COLORS.textMuted}
              />
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const glassMode = useGlassMode();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Tabs
        tabBar={(props) =>
          glassMode ? (
            <GlassTabBar {...props} icons={TAB_ICONS} />
          ) : (
            <CustomTabBar {...props} />
          )
        }
        screenOptions={{
          headerShown: false,
          animation: 'shift',
          sceneStyleInterpolator: routeSlide,
          transitionSpec: routeSpring,
          sceneStyle: glassMode
            ? { backgroundColor: 'transparent' }
            : undefined,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="search" />
        <Tabs.Screen name="library" />
      </Tabs>
    </View>
  );
}
