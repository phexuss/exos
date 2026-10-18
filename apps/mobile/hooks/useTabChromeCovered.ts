import { useEffect, useState } from 'react';

import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';

// Long enough for an overlay's entry transition to finish covering the bar.
const COVER_SETTLE_MS = 400;

/**
 * True once a full-screen overlay (player, settings, artist, …) has finished
 * covering the tab bar and its mini player. Glass mode drops their native
 * blur meanwhile: on Android a hidden blur still re-renders on every frame.
 * Turns false immediately when the overlay starts closing.
 */
export function useTabChromeCovered(): boolean {
  const playerOpen = usePlayerStore(
    (s) => s.isPlayerOpen && s.currentTrack !== null,
  );
  const overlayOpen = useOverlayStore(
    (s) =>
      s.isProfileOpen ||
      s.isSettingsOpen ||
      s.isFaqOpen ||
      s.playlistId !== null ||
      s.artistId !== null ||
      s.albumId !== null,
  );
  const covered = playerOpen || overlayOpen;
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!covered) {
      setSettled(false);
      return;
    }
    const timeout = setTimeout(() => setSettled(true), COVER_SETTLE_MS);
    return () => clearTimeout(timeout);
  }, [covered]);

  return covered && settled;
}
