import { View } from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';

type SectionTitleProps = {
  title: string;
  /** A quiet figure after the title (how many there are). */
  count?: number;
  action?: { label: string; onPress: () => void };
};

/** The heading of a section on a page: bold, with an optional action. */
export function SectionTitle({ title, count, action }: SectionTitleProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: SPACING.md,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: SPACING.sm,
          flexShrink: 1,
        }}
      >
        <AppText
          variant="title"
          weight="bold"
          numberOfLines={1}
          style={{ flexShrink: 1 }}
        >
          {title}
        </AppText>
        {count !== undefined ? (
          <AppText variant="label" style={{ color: COLORS.textMuted }}>
            {count}
          </AppText>
        ) : null}
      </View>
      {action ? (
        <AnimatedPressable onPress={action.onPress} hitSlop={10}>
          <AppText
            variant="label"
            weight="medium"
            style={{ color: COLORS.textSecondary }}
          >
            {action.label}
          </AppText>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}
