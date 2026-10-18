import type { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { IconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { LAYOUT } from '@/constants/layout';
import { useI18n } from '@/hooks/useI18n';

/**
 * How the screen was presented decides its dismiss affordance:
 * - `back`  — pushed in from the right  → chevron-left
 * - `close` — presented from the bottom → chevron-down
 */
type HeaderLeading = 'back' | 'close';

type HeaderAction = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
};

type ScreenHeaderProps = {
  title?: string;
  leading?: HeaderLeading;
  onLeadingPress?: () => void;
  trailing?: HeaderAction;
  /** Free-form trailing content (overrides `trailing`). */
  trailingNode?: ReactNode;
  /**
   * Add the status-bar inset here. Only for screens whose root does NOT
   * already handle the top edge (e.g. content that bleeds under the bar).
   */
  withTopInset?: boolean;
  /** Horizontal padding; defaults to 0 because most screens already pad. */
  gutter?: number;
  style?: StyleProp<ViewStyle>;
};

const SLOT = LAYOUT.iconButton;

/**
 * The standard header row: [dismiss] — title — [action]. Side slots are
 * always reserved so the title stays optically centered.
 */
export function ScreenHeader({
  title,
  leading,
  onLeadingPress,
  trailing,
  trailingNode,
  withTopInset = false,
  gutter = 0,
  style,
}: ScreenHeaderProps) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          height: LAYOUT.headerHeight + (withTopInset ? insets.top : 0),
          paddingTop: withTopInset ? insets.top : 0,
          paddingHorizontal: gutter,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        style,
      ]}
    >
      <View style={{ width: SLOT, alignItems: 'flex-start' }}>
        {leading && onLeadingPress ? (
          <HeaderIconButton
            icon={leading === 'back' ? 'chevron-left' : 'chevron-down'}
            onPress={onLeadingPress}
            accessibilityLabel={
              leading === 'back' ? t('common.back') : t('common.close')
            }
          />
        ) : null}
      </View>

      <View style={{ flex: 1, alignItems: 'center' }}>
        {title ? (
          <AppText variant="label" weight="bold" numberOfLines={1}>
            {title}
          </AppText>
        ) : null}
      </View>

      <View style={{ width: SLOT, alignItems: 'flex-end' }}>
        {trailingNode ??
          (trailing ? (
            <HeaderIconButton
              icon={trailing.icon}
              onPress={trailing.onPress}
              accessibilityLabel={trailing.accessibilityLabel}
            />
          ) : null)}
      </View>
    </View>
  );
}
