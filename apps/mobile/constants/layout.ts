import { SPACING } from '@/constants/spacing';

/**
 * Layout standard for every screen and overlay.
 *
 * Safe areas: every full-screen surface owns its top inset — either via a
 * root `SafeAreaView edges={['top', ...]}` or, for content that bleeds under
 * the status bar (hero images), by offsetting floating controls with
 * `useSafeAreaInsets().top`. Never hardcode status/nav bar sizes: Android 15+
 * (One UI 7, etc.) is always edge-to-edge, so the app draws under both bars.
 */
export const LAYOUT = {
  /** Horizontal page gutter. */
  gutter: SPACING.lg,
  /** Standard header row height (below the status bar). */
  headerHeight: 52,
  /** Visual size of round header/icon buttons. */
  iconButton: 40,
  /** Minimum touch target (Material 48dp / iOS 44pt). */
  minTouch: 44,
  /** Extra breathing room above the home indicator / nav bar in sheets. */
  sheetBottomGap: 12,
} as const;

/** hitSlop that grows a visual `size` button to the minimum touch target. */
export function touchSlop(size: number): number {
  return Math.max(0, Math.ceil((LAYOUT.minTouch - size) / 2));
}
