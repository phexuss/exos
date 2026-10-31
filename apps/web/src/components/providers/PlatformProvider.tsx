'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type Platform = 'desktop' | 'android';

const STORAGE_KEY = 'exos-platform';

type PlatformContextValue = {
  platform: Platform;
  setPlatform: (p: Platform) => void;
};

const PlatformContext = createContext<PlatformContextValue | null>(null);

/**
 * Which app the page is about. The desktop app is the main one now, so it is
 * the default; a visitor who switched to Android sees it again next time.
 * `?app=android` in a link opens the Android version directly.
 */
export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platform, setState] = useState<Platform>('desktop');

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('app');
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {}
    const pick = fromUrl ?? saved;
    if (pick === 'android' || pick === 'desktop') setState(pick);
  }, []);

  const setPlatform = useCallback((p: Platform) => {
    setState(p);
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {}
  }, []);

  return (
    <PlatformContext.Provider value={{ platform, setPlatform }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context)
    throw new Error('usePlatform must be used inside PlatformProvider');
  return context;
}
