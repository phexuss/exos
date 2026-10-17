import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  GLASS_TAB_BAR_HEIGHT,
  GLASS_TAB_BAR_MARGIN,
} from '@/components/glass/GlassTabBar';
import { useGlassMode } from '@/hooks/useGlassMode';
import { usePlayerStore } from '@/store/usePlayerStore';

const GLASS_MINI_PLAYER_HEIGHT = 70;

/**
 * Extra bottom space a tab screen needs in Glass mode, where the tab bar and
 * mini player float above the content instead of taking layout space.
 * Returns 0 outside Glass mode.
 */
export function useGlassBottomInset(): number {
  const glassMode = useGlassMode();
  const insets = useSafeAreaInsets();
  const hasTrack = usePlayerStore((s) => s.currentTrack !== null);

  if (!glassMode) return 0;

  return (
    Math.max(insets.bottom, GLASS_TAB_BAR_MARGIN) +
    GLASS_TAB_BAR_HEIGHT +
    (hasTrack ? GLASS_MINI_PLAYER_HEIGHT : 0)
  );
}
