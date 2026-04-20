import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';

type ScreenContainerProps = {
  children: ReactNode;
  scrollable?: boolean;
};

export function ScreenContainer({
  children,
  scrollable = true,
}: ScreenContainerProps) {
  const content = (
    <View
      style={{
        flex: scrollable ? undefined : 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: 100,
        gap: SPACING.xxl,
      }}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
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
