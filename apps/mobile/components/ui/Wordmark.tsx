import { Text } from 'react-native';

import { COLORS } from '@/constants/colors';
import { FONT_FAMILY } from '@/constants/typography';

type WordmarkProps = {
  size: number;
  /** Colour of the Ø; the rest is white, as on desktop. */
  accent?: string;
};

/** Desktop letter spacing for the mark, as a share of the font size. */
const TRACKING = 0.06;

/** The EXØS wordmark: black-weight letters with the Ø in the accent. */
export function Wordmark({ size, accent = COLORS.accent }: WordmarkProps) {
  return (
    <Text
      accessibilityRole="header"
      allowFontScaling={false}
      style={{
        fontFamily: FONT_FAMILY.black,
        fontSize: size,
        lineHeight: Math.round(size * 1.15),
        letterSpacing: size * TRACKING,
        color: COLORS.textPrimary,
        includeFontPadding: false,
      }}
    >
      EX<Text style={{ color: accent }}>Ø</Text>S
    </Text>
  );
}
