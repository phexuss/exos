import { useEffect, useRef, useState } from 'react';

import { COLORS } from '@/constants/colors';
import { apiGet } from '@/services/api/client';
import { API_ENDPOINTS } from '@/services/api/endpoints';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useSettingsStore } from '@/store/useSettingsStore';

const cache = new Map<string, string>();

export function useDynamicAccent(): string {
  const coverUrl = usePlayerStore((s) => s.currentTrack?.coverUrl);
  const dynamicAccent = useSettingsStore((s) => s.dynamicAccent);
  const [color, setColor] = useState<string>(COLORS.accent);
  const lastUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!dynamicAccent || !coverUrl) {
      setColor(COLORS.accent);
      return;
    }

    if (coverUrl === lastUrlRef.current) return;
    lastUrlRef.current = coverUrl;

    const cached = cache.get(coverUrl);
    if (cached) {
      setColor(cached);
      return;
    }

    let cancelled = false;

    apiGet<{ color: string }>(API_ENDPOINTS.color, { url: coverUrl })
      .then(({ color: hex }) => {
        if (!cancelled) {
          cache.set(coverUrl, hex);
          setColor(hex);
        }
      })
      .catch(() => {
        if (!cancelled) setColor(COLORS.accent);
      });

    return () => { cancelled = true; };
  }, [coverUrl, dynamicAccent]);

  return dynamicAccent ? color : COLORS.accent;
}
