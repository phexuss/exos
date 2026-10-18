import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassAmbientBackground } from '@/components/glass/GlassAmbientBackground';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { useGlassBottomInset } from '@/hooks/useGlassBottomInset';
import { useGlassMode } from '@/hooks/useGlassMode';

type ScreenContainerProps = {
  children: ReactNode;
  scrollable?: boolean;
  /** Screen sits under the (floating in Glass mode) tab bar. */
  withTabBar?: boolean;
};

export function ScreenContainer({
  children,
  scrollable = true,
  withTabBar = false,
}: ScreenContainerProps) {
  const glassInset = useGlassBottomInset();
  const glassMode = useGlassMode();
  const content = (
    <View
      style={{
        flex: scrollable ? undefined : 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: 100 + (withTabBar ? glassInset : 0),
        gap: SPACING.xxl,
      }}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      // The tab bar owns the bottom inset on tab screens; overlays own both.
      edges={withTabBar ? ['top'] : ['top', 'bottom']}
      style={{
        flex: 1,
        backgroundColor: glassMode ? 'transparent' : COLORS.background,
      }}
    >
      {/* Tab screens draw their own glow: on Android native blur only sees
          content inside the same navigation screen. Overlays bring their own. */}
      {glassMode && withTabBar ? <GlassAmbientBackground /> : null}
      {scrollable ? (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
