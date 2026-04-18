import type { TextStyle } from "react-native";

export const FONT_FAMILY = {
  light: "Satoshi-Light",
  regular: "Satoshi-Regular",
  medium: "Satoshi-Medium",
  bold: "Satoshi-Bold",
  black: "Satoshi-Black",
} as const;

export type TextVariant = "display" | "title" | "body" | "caption" | "label";

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
