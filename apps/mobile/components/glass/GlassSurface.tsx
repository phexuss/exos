import { type BlurTint, BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { GLASS, type GlassVariant } from '@/constants/glass';
import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * Frosted "liquid glass" container. Put size/position/margins in `style` and
 * inner layout (padding, flexDirection, gap) in `contentStyle`.
 */
type GlassSurfaceProps = {
  children?: ReactNode;
  variant?: GlassVariant;
  /** Overrides the blur radius for this surface. */
  intensity?: number;
  /** Adds a soft drop shadow so the surface reads as floating above content. */
  floating?: boolean;
  /** Draws the top specular highlight. On by default. */
  highlight?: boolean;
  /**
   * Native backdrop blur. Turn off for many surfaces inside scrolling content
   * over a static backdrop — the tint alone reads as frosted and is far
   * cheaper on Android.
   */
  blur?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

const IOS_TINT: Record<GlassVariant, BlurTint> = {
  thin: 'systemUltraThinMaterialDark',
  regular: 'systemThinMaterialDark',
  thick: 'systemMaterialDark',
};

export function GlassSurface({
  children,
  variant = 'regular',
  intensity,
  floating,
  highlight = true,
  blur = true,
  style,
  contentStyle,
}: GlassSurfaceProps) {
  const liveBlur = useSettingsStore((s) => s.glassBlur);
  const nativeBlur = blur && liveBlur;
  // A surface that asked for blur but doesn't get it covers moving content,
  // so it needs the denser tint to stay legible.
  const tint = blur && !liveBlur ? GLASS.tintDense : GLASS.tint;
  const flat = StyleSheet.flatten(style) ?? {};
  const radius = flat.borderRadius ?? GLASS.radius.card;

  const surface = (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          // A square surface is a full-screen layer: no rim along the screen edge.
          borderWidth: radius !== 0 ? StyleSheet.hairlineWidth : 0,
          borderColor: GLASS.rim,
        },
        floating ? undefined : style,
        floating ? { flexGrow: 1 } : undefined,
      ]}
    >
      {nativeBlur ? (
        <BlurView
          pointerEvents="none"
          intensity={intensity ?? GLASS.blur[variant]}
          tint={Platform.OS === 'ios' ? IOS_TINT[variant] : 'dark'}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: tint[variant] }]}
      />
      {highlight ? (
        <LinearGradient
          pointerEvents="none"
          colors={[GLASS.highlightTop, GLASS.highlightBottom]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60%',
          }}
        />
      ) : null}
      <View style={contentStyle}>{children}</View>
    </View>
  );

  if (!floating) return surface;

  // Shadows get clipped by `overflow: hidden`, so a floating surface needs an
  // unclipped wrapper. Android elevation renders through translucent fills, so
  // the shadow is iOS-only there.
  return (
    <View
      style={[
        style,
        {
          borderRadius: radius,
          backgroundColor: 'transparent',
          borderWidth: 0,
          padding: 0,
        },
        Platform.OS === 'ios'
          ? {
              shadowColor: GLASS.shadow,
              shadowOpacity: 0.35,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 10 },
            }
          : undefined,
      ]}
    >
      {surface}
    </View>
  );
}
