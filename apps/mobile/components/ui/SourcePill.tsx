import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { SOURCES, type SourceKey } from '@/constants/sources';

type SourcePillProps = {
  source: SourceKey;
  selected?: boolean;
  /** Translucent frosted look for Glass mode. */
  glass?: boolean;
};

export function SourcePill({ source, selected, glass }: SourcePillProps) {
  const srcColor = SOURCES[source].color;
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 0.5,
        borderColor: selected ? srcColor : glass ? GLASS.rim : COLORS.border,
        backgroundColor: selected
          ? `${srcColor}1F`
          : glass
            ? GLASS.innerGlow
            : 'transparent',
      }}
    >
      <AppText
        variant="caption"
        weight="medium"
        style={{
          color: selected ? srcColor : COLORS.textMuted,
          letterSpacing: 0.5,
        }}
      >
        {SOURCES[source].label}
      </AppText>
    </View>
  );
}
