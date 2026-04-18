import type { TextProps, TextStyle } from "react-native";
import { Text } from "react-native";

import { COLORS } from "@/constants/colors";
import {
  FONT_FAMILY,
  TEXT_VARIANTS,
  type TextVariant,
} from "@/constants/typography";

type Weight = keyof typeof FONT_FAMILY;

type AppTextProps = TextProps & {
  variant?: TextVariant;
  weight?: Weight;
  style?: TextStyle | TextStyle[];
};

export function AppText({
  variant = "body",
  weight = "regular",
  style,
  children,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        TEXT_VARIANTS[variant],
        { color: COLORS.textPrimary, fontFamily: FONT_FAMILY[weight] },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
