import { View } from 'react-native';

import { DeezerIcon } from '@/components/icons/DeezerIcon';
import { SoundCloudIcon } from '@/components/icons/SoundCloudIcon';
import { AppText } from '@/components/ui/AppText';
import { SOURCES, type SourceKey } from '@/constants/sources';

type SourceBadgeProps = {
  source: SourceKey | null | undefined;
};

const SOURCE_ICON: Partial<
  Record<SourceKey, (color: string) => React.ReactNode>
> = {
  soundcloud: (color) => <SoundCloudIcon size={7} color={color} />,
  deezer: (color) => <DeezerIcon size={12} color={color} />,
};

export function SourceBadge({ source }: SourceBadgeProps) {
  const safeSource = source && source in SOURCES ? source : 'deezer';
  const srcColor = SOURCES[safeSource].color;
  const renderIcon = SOURCE_ICON[safeSource];

  return (
    <View
      style={{
        paddingHorizontal: 5,
        paddingVertical: 3,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: `${srcColor}40`,
        backgroundColor: `${srcColor}1A`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {renderIcon ? (
        renderIcon(srcColor)
      ) : (
        <AppText
          variant="caption"
          weight="medium"
          style={{
            fontSize: 9,
            lineHeight: 12,
            letterSpacing: 1,
            color: srcColor,
          }}
        >
          {SOURCES[safeSource].badge}
        </AppText>
      )}
    </View>
  );
}
