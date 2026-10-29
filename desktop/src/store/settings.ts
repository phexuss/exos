import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { type Locale, systemLocale } from '@/i18n/locale';

export type VizStyle = 'bars' | 'wave' | 'vu';

export type CookiesBrowser = '' | 'chrome' | 'firefox' | 'edge' | 'brave' | 'opera' | 'vivaldi' | 'safari';

type SettingsState = {
  locale: Locale;
  glassMode: boolean;
  /** Accent color follows the current artwork. */
  dynamicAccent: boolean;
  /** null = the engine's default (~/Music/EXØS). */
  musicDir: string | null;
  format: 'opus' | 'm4a' | 'mp3';
  /** MP3 bitrate, kbit/s. */
  mp3Bitrate: 128 | 192 | 320;
  /** Pass the browser's YouTube cookies to yt-dlp when YouTube asks to sign in. */
  cookiesBrowser: CookiesBrowser;
  volume: number;
  /** Playback speed; the pitch follows it (sped up / slowed). */
  speed: number;
  /** Reverb mix, 0..1. */
  reverb: number;
  /** Frame counter in the title bar. */
  showFps: boolean;
  /** Visualizers that move with the music (player bar, now playing, the playing-track bars). */
  visualizer: boolean;
  /** Which one the now playing view shows. */
  vizStyle: VizStyle;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      locale: systemLocale(),
      glassMode: true,
      dynamicAccent: true,
      musicDir: null,
      format: 'm4a',
      mp3Bitrate: 320,
      cookiesBrowser: '',
      volume: 0.8,
      speed: 1,
      reverb: 0,
      showFps: false,
      visualizer: true,
      vizStyle: 'bars',
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
