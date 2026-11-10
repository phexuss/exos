import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/ui/Skeleton';
import { LAYOUT } from '@/constants/layout';
import { SPACING } from '@/constants/spacing';

const ROWS = ['62%', '48%', '70%', '54%', '66%'] as const;

/**
 * A playlist, album or artist page while it loads: the shape of what is
 * coming (cover, name, buttons, rows) instead of a spinner in the middle of
 * an empty screen.
 */
export function CollectionSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top + LAYOUT.headerHeight,
        paddingHorizontal: SPACING.xl,
        gap: SPACING.xl,
      }}
    >
      <View style={{ alignItems: 'center', gap: SPACING.xl }}>
        <Skeleton width={216} height={216} radius={SPACING.lg} />
        <Skeleton width={180} height={24} radius={8} />
      </View>
      <View style={{ flexDirection: 'row', gap: SPACING.md }}>
        <View style={{ flex: 1 }}>
          <Skeleton width="100%" height={48} radius={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Skeleton width="100%" height={48} radius={24} />
        </View>
      </View>
      <View style={{ gap: SPACING.lg }}>
        {ROWS.map((width) => (
          <View
            key={width}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.md,
            }}
          >
            <Skeleton width={48} height={48} radius={8} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width={width} height={12} radius={4} />
              <Skeleton width="34%" height={10} radius={4} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
