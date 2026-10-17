import { BlurView } from 'expo-blur';
import { type ReactNode, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/GlassSurface';
import {
  glassPresentEntering,
  glassPresentExiting,
} from '@/components/glass/transitions';
import { GLASS, GLASS_SPRING } from '@/constants/glass';
import { useGlassMode } from '@/hooks/useGlassMode';

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

const ENTER_MS = 180;
const CENTER_EXIT_MS = 160;
const SHEET_EXIT_MS = 220;
const GLASS_SHEET_GAP = 8;

/** Dialog "lands" onto the screen: fades in while settling from 112% scale. */
function glassDialogEntering() {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ scale: 1.12 }] },
    animations: {
      opacity: withTiming(1, { duration: ENTER_MS }),
      transform: [{ scale: withSpring(1, GLASS_SPRING.snappy) }],
    },
  };
}

function glassDialogExiting() {
  'worklet';
  return {
    initialValues: { opacity: 1, transform: [{ scale: 1 }] },
    animations: {
      opacity: withTiming(0, { duration: CENTER_EXIT_MS }),
      transform: [{ scale: withTiming(0.94, { duration: CENTER_EXIT_MS }) }],
    },
  };
}

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
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const exitDuration = variant === 'sheet' ? SHEET_EXIT_MS : CENTER_EXIT_MS;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }

    if (!mounted) return;

    const timeout = setTimeout(() => setMounted(false), exitDuration);
    return () => clearTimeout(timeout);
  }, [visible, mounted, exitDuration]);

  if (!mounted) return null;

  const isSheet = variant === 'sheet';

  const contentEntering = glassMode
    ? isSheet
      ? glassPresentEntering()
      : glassDialogEntering
    : isSheet
      ? SlideInDown.duration(240)
      : FadeIn.duration(ENTER_MS);
  const contentExiting = glassMode
    ? isSheet
      ? glassPresentExiting()
      : glassDialogExiting
    : isSheet
      ? SlideOutDown.duration(exitDuration)
      : FadeOut.duration(exitDuration);

  let content: ReactNode = children;
  let animatedContentStyle: StyleProp<ViewStyle> = contentStyle;

  if (glassMode) {
    const { outer, inner } = splitGlassStyle(contentStyle);
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
          // The floating sheet already clears the home indicator.
          isSheet ? { paddingBottom: 16 } : undefined,
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
      statusBarTranslucent={glassMode}
      onRequestClose={onRequestClose}
    >
      {visible ? (
        <Animated.View
          entering={FadeIn.duration(ENTER_MS)}
          exiting={FadeOut.duration(exitDuration)}
          style={[
            {
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: isSheet ? 'flex-end' : 'center',
            },
            backdropStyle,
            glassMode ? { backgroundColor: GLASS.scrim } : undefined,
          ]}
        >
          {glassMode ? (
            <BlurView
              pointerEvents="none"
              intensity={GLASS.blur.backdrop}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          <Pressable
            disabled={disableBackdropPress}
            onPress={onBackdropPress}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          />
          <AnimatedPressable
            entering={contentEntering}
            exiting={contentExiting}
            style={animatedContentStyle}
          >
            {content}
          </AnimatedPressable>
        </Animated.View>
      ) : null}
    </Modal>
  );
}
