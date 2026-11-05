import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GlassTabBar } from '@/components/glass/GlassTabBar';
import { MiniPlayer } from '@/components/MiniPlayer';
import { RouteIn } from '@/components/motion/RouteIn';
import type { IconName } from '@/components/ui/AppIcon';
import { AppIcon } from '@/components/ui/AppIcon';
import { COLORS } from '@/constants/colors';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useI18n } from '@/hooks/useI18n';

// A screen that throws while rendering shows a retry button here instead of
// unmounting the whole app (the player and overlays stay up).
export { ScreenErrorFallback as ErrorBoundary } from '@/components/ScreenErrorFallback';

const TAB_ICONS: Record<string, IconName> = {
  index: 'home',
  search: 'search',
  library: 'library',
};

/** Bar order, for the side a tab screen slides in from. */
const TAB_ORDER = Object.keys(TAB_ICONS);

function CustomTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
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
              accessibilityRole="tab"
              accessibilityLabel={descriptors[route.key]?.options.title}
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
  const { t } = useI18n();
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
        // The slide-in lives inside each screen (RouteIn). The navigator's own
        // scene animation stays off: it animates react-native-screens'
        // activityState, which re-attaches whole screens mid-transition and
        // stops hidden tabs from freezing.
        screenLayout={({ route, children }) => (
          <RouteIn index={Math.max(TAB_ORDER.indexOf(route.name), 0)}>
            {children}
          </RouteIn>
        )}
        screenOptions={{
          headerShown: false,
          animation: 'none',
          // Hidden tabs stop re-rendering on player/store updates.
          freezeOnBlur: true,
          sceneStyle: glassMode
            ? { backgroundColor: 'transparent' }
            : undefined,
        }}
      >
        <Tabs.Screen name="index" options={{ title: t('common.home') }} />
        <Tabs.Screen name="search" options={{ title: t('common.search') }} />
        <Tabs.Screen name="library" options={{ title: t('common.library') }} />
      </Tabs>
    </View>
  );
}
