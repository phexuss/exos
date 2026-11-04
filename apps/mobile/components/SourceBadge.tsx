import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { SOURCES, type SourceKey } from '@/constants/sources';

type SourceBadgeProps = {
  source: SourceKey | null | undefined;
};

// Same pill as the desktop track table (`.src-pill`): the source name in a
// lighter tint of its brand color on a 16% wash of it.
const PILL_TEXT: Partial<Record<SourceKey, string>> = {
  deezer: '#C78BFF',
  soundcloud: '#FF8A4C',
};

export function SourceBadge({ source }: SourceBadgeProps) {
  const safeSource = source && source in SOURCES ? source : 'deezer';
  const { color, label } = SOURCES[safeSource];

  return (
    <View
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
        {label.toUpperCase()}
      </AppText>
    </View>
  );
}
