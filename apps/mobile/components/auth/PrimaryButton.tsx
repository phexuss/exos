import { ActivityIndicator, View } from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
};

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: PrimaryButtonProps) {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      scaleValue={0.97}
      onPress={() => {
        if (!isDisabled) onPress();
      }}
      style={{
        backgroundColor: isPrimary ? COLORS.textPrimary : 'transparent',
        borderWidth: isPrimary ? 0 : 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingVertical: 16,
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isPrimary ? COLORS.background : COLORS.textPrimary}
          />
        ) : null}
        <AppText
          variant="body"
          weight="bold"
          style={{
            color: isPrimary ? COLORS.background : COLORS.textPrimary,
            fontSize: 15,
          }}
        >
          {label}
        </AppText>
      </View>
    </AnimatedPressable>
  );
}
