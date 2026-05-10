import type { TextStyle } from 'react-native';

export const FONT_FAMILY = {
  light: 'Jost-Light',
  regular: 'Jost-Regular',
  medium: 'Jost-Medium',
  bold: 'Jost-Bold',
  black: 'Jost-Black',
} as const;

export type TextVariant = 'display' | 'title' | 'body' | 'caption' | 'label';

export const TEXT_VARIANTS: Record<TextVariant, TextStyle> = {
  display: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
};
