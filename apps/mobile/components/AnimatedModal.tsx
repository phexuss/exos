import { BlurView } from 'expo-blur';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/GlassSurface';
import { GLASS, SECONDARY_BLUR } from '@/constants/glass';
import { LAYOUT } from '@/constants/layout';
import {
  DESKTOP_SPRING,
  EASE_OUT,
  MOTION,
  prefersReducedMotion,
} from '@/constants/motion';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useSettingsStore } from '@/store/useSettingsStore';

type AnimatedModalVariant = 'center' | 'sheet';

type AnimatedModalProps = {
  visible: boolean;
  children: ReactNode;
  variant?: AnimatedModalVariant;
  onRequestClose: () => void;
  onBackdropPress?: () => void;
  backdropStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  disableBackdropPress?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CENTER_EXIT_MS = MOTION.dur.quick;
const SHEET_EXIT_MS = 220;
const GLASS_SHEET_GAP = 8;
/** A dialog grows into place from this size (desktop `menu-in`). */
const DIALOG_FROM_SCALE = 0.97;

const SURFACE_KEYS = new Set([
  'backgroundColor',
  'borderWidth',
  'borderColor',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'overflow',
]);

const OUTER_KEYS = new Set([
  'margin',
  'marginHorizontal',
  'marginVertical',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'width',
  'maxWidth',
  'height',
  'maxHeight',
  'minHeight',
  'alignSelf',
]);

/**
 * Splits a solid-surface `contentStyle` into what a glass surface needs:
 * outer box (size/margins) and inner layout (padding, gap, …). Solid colors,
 * borders and radii are dropped — the glass surface provides its own.
 */
function splitGlassStyle(style: StyleProp<ViewStyle>) {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flat)) {
    if (SURFACE_KEYS.has(key)) continue;
    if (OUTER_KEYS.has(key)) outer[key] = value;
    else inner[key] = value;
  }
  return { outer: outer as ViewStyle, inner: inner as ViewStyle };
}

export function AnimatedModal({
  visible,
  children,
  variant = 'center',
  onRequestClose,
  onBackdropPress = onRequestClose,
  backdropStyle,
  contentStyle,
  disableBackdropPress,
}: AnimatedModalProps) {
  const glassMode = useGlassMode();
  const liveBlur = useSettingsStore((s) => s.glassBlur);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [progress] = useState(() => new Animated.Value(0));
  const isSheet = variant === 'sheet';
  const exitDuration = isSheet ? SHEET_EXIT_MS : CENTER_EXIT_MS;

  // Enter: spring the one progress value up once the modal is on screen.
  useEffect(() => {
    if (!visible) return;
    if (!mounted) {
      setMounted(true);
      return;
    }
    if (prefersReducedMotion()) {
      progress.setValue(1);
      return;
    }
    const run = Animated.spring(progress, {
      toValue: 1,
      ...DESKTOP_SPRING,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [visible, mounted, progress]);

  // Exit: play it back down, then take the modal off screen. Reopening
  // mid-exit stops this and springs up from wherever it got to.
  useEffect(() => {
    if (visible || !mounted) return;
    const run = Animated.timing(progress, {
      toValue: 0,
      duration: prefersReducedMotion() ? 0 : exitDuration,
      easing: EASE_OUT,
      useNativeDriver: true,
    });
    run.start(({ finished }) => {
      if (finished) setMounted(false);
    });
    return () => run.stop();
  }, [visible, mounted, exitDuration, progress]);

  // Built once per size: fresh interpolations each render would rewire the
  // native animation graph.
  const motion = useMemo(() => {
    const fade = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    return {
      backdrop: { opacity: fade },
      content: isSheet
        ? {
            transform: [
              {
                // Clamped so the spring's overshoot never lifts the sheet
                // off the bottom edge.
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height, 0],
                  extrapolate: 'clamp',
                }),
              },
            ],
          }
        : {
            opacity: fade,
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [DIALOG_FROM_SCALE, 1],
                }),
              },
            ],
          },
    };
  }, [progress, isSheet, height]);

  if (!mounted) return null;

  // The caller's backdrop colour goes on the fading scrim; the rest (padding)
  // stays on the layout layer.
  const { backgroundColor: callerScrim, ...layout } =
    StyleSheet.flatten(backdropStyle) ?? {};
  const scrim = glassMode
    ? liveBlur
      ? GLASS.scrim
      : GLASS.scrimDense
    : (callerScrim ?? GLASS.scrimDense);

  let content: ReactNode = children;
  let animatedContentStyle: StyleProp<ViewStyle> = contentStyle;

  if (!glassMode && isSheet) {
    // Never trust a hardcoded bottom padding: gesture nav, 3-button nav and
    // the iOS home indicator all differ. Keep the caller's padding as a
    // minimum and clear the real system inset.
    const requested = StyleSheet.flatten(contentStyle)?.paddingBottom;
    animatedContentStyle = [
      contentStyle,
      {
        paddingBottom: Math.max(
          typeof requested === 'number' ? requested : 0,
          insets.bottom + LAYOUT.sheetBottomGap,
        ),
      },
    ];
  }

  if (glassMode) {
    const { outer, inner } = splitGlassStyle(contentStyle);
    const requestedPadding = inner.paddingBottom;
    animatedContentStyle = isSheet
      ? [
          outer,
          {
            marginHorizontal: GLASS_SHEET_GAP,
            marginBottom: Math.max(insets.bottom, GLASS_SHEET_GAP),
          },
        ]
      : outer;
    content = (
      <GlassSurface
        floating
        variant="thick"
        // The backdrop behind is already blurred. On Android a blur inside the
        // modal's own window can't track the sheet as it slides in. Without
        // live blur, asking for one gets the sheet the dense tint instead.
        blur={SECONDARY_BLUR || !liveBlur}
        style={[
          {
            borderRadius: isSheet ? GLASS.radius.sheet : GLASS.radius.dialog,
          },
          // Size constraints live on the animated wrapper; the surface just
          // fills/obeys it so scrollable children can shrink.
          outer.height !== undefined ? { flex: 1 } : undefined,
          outer.maxHeight !== undefined ? { maxHeight: '100%' } : undefined,
        ]}
        contentStyle={[
          inner,
          // The floating sheet already clears the home indicator; keep any
          // larger padding the caller asked for.
          isSheet
            ? {
                paddingBottom: Math.max(
                  typeof requestedPadding === 'number' ? requestedPadding : 0,
                  16,
                ),
              }
            : undefined,
          outer.height !== undefined ? { flex: 1 } : { flexShrink: 1 },
        ]}
      >
        {children}
      </GlassSurface>
    );
  }

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      // Draw edge-to-edge like the rest of the app (Android 15+ default);
      // layout then accounts for system bars via safe-area insets.
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onRequestClose}
    >
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          {
            flex: 1,
            justifyContent: isSheet ? 'flex-end' : 'center',
          },
          layout,
        ]}
      >
        {/* The scrim fades on its own layer so the content's opacity isn't
            multiplied by it. */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: scrim },
            motion.backdrop,
          ]}
        >
          {glassMode && liveBlur ? (
            <BlurView
              pointerEvents="none"
              intensity={GLASS.blur.backdrop}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
          ) : null}
        </Animated.View>
        <Pressable
          disabled={disableBackdropPress}
          onPress={onBackdropPress}
          style={StyleSheet.absoluteFill}
        />
        {/* Lifts sheets and dialogs with inputs above the keyboard. */}
        <KeyboardAvoidingView
          behavior="padding"
          pointerEvents="box-none"
          style={{
            flex: 1,
            justifyContent: isSheet ? 'flex-end' : 'center',
            alignItems: layout.alignItems,
          }}
        >
          <AnimatedPressable style={[animatedContentStyle, motion.content]}>
            {content}
          </AnimatedPressable>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
