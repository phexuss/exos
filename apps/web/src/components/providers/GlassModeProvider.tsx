'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export const GLASS_MODE_STORAGE_KEY = 'exos-glass-mode';
export const GLASS_MODE_CLASS = 'glass';

/**
 * Runs before hydration. Glass is on by default, as in the desktop app; only
 * a visitor who turned it off sees the solid look.
 */
export const glassModeInitScript = `try{if(localStorage.getItem('${GLASS_MODE_STORAGE_KEY}')!=='0')document.documentElement.classList.add('${GLASS_MODE_CLASS}')}catch(e){document.documentElement.classList.add('${GLASS_MODE_CLASS}')}`;

type GlassModeContextValue = {
  glassMode: boolean;
  toggleGlassMode: () => void;
};

const GlassModeContext = createContext<GlassModeContextValue | null>(null);

/**
 * "Liquid glass" look, mirroring the apps' Glass mode setting. On by default
 * like the desktop app; the choice is remembered per browser. Styling hangs off the
 * `glass` class on <html> (see the `glass:` variant in globals.css).
 */
export function GlassModeProvider({ children }: { children: ReactNode }) {
  const [glassMode, setGlassMode] = useState(true);

  useEffect(() => {
    setGlassMode(document.documentElement.classList.contains(GLASS_MODE_CLASS));
  }, []);

  const toggleGlassMode = useCallback(() => {
    setGlassMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle(GLASS_MODE_CLASS, next);
      try {
        localStorage.setItem(GLASS_MODE_STORAGE_KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  }, []);

  return (
    <GlassModeContext.Provider value={{ glassMode, toggleGlassMode }}>
      {children}
    </GlassModeContext.Provider>
  );
}

export function useGlassMode() {
  const context = useContext(GlassModeContext);
  if (!context) {
    throw new Error('useGlassMode must be used inside GlassModeProvider');
  }
  return context;
}
