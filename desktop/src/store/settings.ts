import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CookiesBrowser = '' | 'chrome' | 'firefox' | 'edge' | 'brave' | 'opera' | 'vivaldi' | 'safari';

type SettingsState = {
  glassMode: boolean;
  /** Accent color follows the current artwork. */
  dynamicAccent: boolean;
  /** null = the engine's default (~/Music/EXØS). */
  musicDir: string | null;
  format: 'm4a' | 'mp3';
  /** Pass the browser's YouTube cookies to yt-dlp when YouTube asks to sign in. */
  cookiesBrowser: CookiesBrowser;
  volume: number;
  /** Frame counter in the title bar. */
  showFps: boolean;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      glassMode: true,
      dynamicAccent: true,
      musicDir: null,
      format: 'm4a',
      cookiesBrowser: '',
      volume: 0.8,
      showFps: false,
      set: (patch) => set(patch),
    }),
    {
      name: 'exos.settings',
      storage: createJSONStorage(() => {
        try {
          return localStorage;
        } catch {
          return sessionStorage;
        }
      }),
    },
  ),
);
