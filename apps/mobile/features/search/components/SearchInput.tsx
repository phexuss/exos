import type { TextInputProps } from 'react-native';
import { TextInput, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { FONT_FAMILY } from '@/constants/typography';

type SearchInputProps = TextInputProps;

export function SearchInput(props: SearchInputProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: 14,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <AppIcon name="search" size={18} color={COLORS.textMuted} />
      <TextInput
        {...props}
        placeholderTextColor={COLORS.textMuted}
        style={{
          flex: 1,
          color: COLORS.textPrimary,
          fontSize: 16,
          fontFamily: FONT_FAMILY.regular,
        }}
      />
    </View>
  );
}
