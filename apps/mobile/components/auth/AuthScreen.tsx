import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Aurora } from '@/components/auth/Aurora';
import { GlassIconButton } from '@/components/glass/GlassIconButton';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { Rise } from '@/components/motion/Rise';
import { AppText } from '@/components/ui/AppText';
import { Wordmark } from '@/components/ui/Wordmark';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { LAYOUT } from '@/constants/layout';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';

type AuthScreenProps = {
  title: string;
  subtitle?: ReactNode;
  onBack?: () => void;
  /** The form: fields, messages, the submit button, the card's foot links. */
  children: ReactNode;
  /** Quiet actions under the card (continue offline). */
  after?: ReactNode;
};

/** Desktop `.login__card` inner padding and rhythm. */
const CARD_PADDING = SPACING.xxl;
const CARD_GAP = 18;

/**
 * Shell of every sign-in step, after the desktop sign-in: the drifting
 * aurora, the wordmark, and the form on one glass card that rises in.
 * The card's glass is tint only: over a backdrop that only moves by
 * transforms, live blur would re-blur the screen each frame for no gain.
 */
export function AuthScreen({
  title,
  subtitle,
  onBack,
  children,
  after,
}: AuthScreenProps) {
  const { t } = useI18n();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.ink }}>
      <Aurora />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAwareScrollView
          bottomOffset={SPACING.xxl}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: LAYOUT.gutter,
            paddingTop: SPACING.sm,
            paddingBottom: SPACING.xxl,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: LAYOUT.iconButton }}>
            {onBack ? (
              <GlassIconButton
                icon="chevron-left"
                onPress={onBack}
                size={LAYOUT.iconButton}
                accessibilityLabel={t('common.back')}
              />
            ) : null}
          </View>

          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              gap: SPACING.xl,
              paddingVertical: SPACING.xxl,
            }}
          >
            <Rise index={0} style={{ paddingHorizontal: SPACING.xs }}>
              <Wordmark size={40} />
            </Rise>

            <Rise index={1}>
              <GlassSurface
                blur={false}
                floating
                style={{ borderRadius: GLASS.radius.card }}
                contentStyle={{ padding: CARD_PADDING, gap: CARD_GAP }}
              >
                <View style={{ gap: 6 }}>
                  <AppText variant="display" weight="bold">
                    {title}
                  </AppText>
                  {subtitle ? (
                    <AppText
                      variant="body"
                      style={{ color: COLORS.textSecondary, fontSize: 14 }}
                    >
                      {subtitle}
                    </AppText>
                  ) : null}
                </View>
                {children}
              </GlassSurface>
            </Rise>

            {after ? <Rise index={2}>{after}</Rise> : null}
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}

/** A line of foot text with an accent action: "No account? Create one". */
export function AuthLink({
  prefix,
  label,
  onPress,
  disabled,
  align = 'flex-start',
}: {
  prefix?: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  align?: 'flex-start' | 'center' | 'flex-end';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="link"
      style={({ pressed }) => ({
        alignSelf: align,
        paddingVertical: 2,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <AppText
        variant="label"
        style={{ color: COLORS.textMuted, fontSize: 13 }}
      >
        {prefix ? `${prefix} ` : null}
        <AppText
          variant="label"
          weight="medium"
          style={{
            color: disabled ? COLORS.textMuted : COLORS.accent,
            fontSize: 13,
          }}
        >
          {label}
        </AppText>
      </AppText>
    </Pressable>
  );
}

/** Inline result line inside the card: an error, or a quiet confirmation. */
export function AuthNote({
  tone,
  children,
}: {
  tone: 'error' | 'info';
  children: ReactNode;
}) {
  return (
    <AppText
      variant="label"
      accessibilityLiveRegion="polite"
      style={{
        color: tone === 'error' ? COLORS.danger : COLORS.accent,
        fontSize: 13,
      }}
    >
      {children}
    </AppText>
  );
}
