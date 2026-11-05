import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { SOURCES, type SourceKey } from '@/constants/sources';

type SourceBadgeProps = {
  source: SourceKey | null | undefined;
};

// Desktop track-table pill (`.src-pill`) with the short code (SC, DZR), so
// it fits next to long titles: a lighter tint of the brand color on a 16%
// wash of it. The full name stays for screen readers.
const PILL_TEXT: Partial<Record<SourceKey, string>> = {
  deezer: '#C78BFF',
  soundcloud: '#FF8A4C',
};

export function SourceBadge({ source }: SourceBadgeProps) {
  const safeSource = source && source in SOURCES ? source : 'deezer';
  const { color, label, badge } = SOURCES[safeSource];

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{
        height: 18,
        paddingHorizontal: 6,
        borderRadius: 5,
        backgroundColor: `${color}29`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText
        variant="caption"
        weight="bold"
        numberOfLines={1}
        style={{
          fontSize: 10.5,
          lineHeight: 14,
          letterSpacing: 0.4,
          color: PILL_TEXT[safeSource] ?? color,
        }}
      >
        {badge}
      </AppText>
    </View>
  );
}
