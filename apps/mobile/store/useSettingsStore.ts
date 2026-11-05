import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { clampFx, FX_PRESETS, type Fx } from '@/services/audio/fx';

const STORAGE_KEY = 'settings:dynamicAccent';
const FAQ_KEY = 'settings:hasSeenFaq';
const GLASS_KEY = 'settings:glassMode';
const GLASS_BLUR_KEY = 'settings:glassBlur';
const FX_KEY = 'settings:fx';

// Android's native blur re-draws the whole screen behind every blurred
// surface on each frame anything moves, which stutters on most phones. Glass
// mode there uses dense tinted glass unless the user turns live blur on.
const GLASS_BLUR_DEFAULT = Platform.OS !== 'android';

type SettingsState = {
  dynamicAccent: boolean;
  setDynamicAccent: (enabled: boolean) => void;
  hasSeenFaq: boolean;
  setHasSeenFaq: (seen: boolean) => void;
  glassMode: boolean;
  setGlassMode: (enabled: boolean) => void;
  glassBlur: boolean;
  setGlassBlur: (enabled: boolean) => void;
  /** Sped up / slowed and reverb amount, kept across launches like on desktop. */
  speed: number;
  reverb: number;
  setFx: (fx: Partial<Fx>) => void;
  _hydrated: boolean;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  dynamicAccent: true,
  hasSeenFaq: false,
  // Same look as the desktop app: glass over the artwork-tinted backdrop.
  glassMode: true,
  glassBlur: GLASS_BLUR_DEFAULT,
  speed: FX_PRESETS.off.speed,
  reverb: FX_PRESETS.off.reverb,
  _hydrated: false,

  setDynamicAccent: (enabled) => {
    set({ dynamicAccent: enabled });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled)).catch(() => {});
  },

  setHasSeenFaq: (seen) => {
    set({ hasSeenFaq: seen });
    AsyncStorage.setItem(FAQ_KEY, JSON.stringify(seen)).catch(() => {});
  },

  setGlassMode: (enabled) => {
    set({ glassMode: enabled });
    AsyncStorage.setItem(GLASS_KEY, JSON.stringify(enabled)).catch(() => {});
  },

  setGlassBlur: (enabled) => {
    set({ glassBlur: enabled });
    AsyncStorage.setItem(GLASS_BLUR_KEY, JSON.stringify(enabled)).catch(
      () => {},
    );
  },

  setFx: (fx) => {
    set((s) => {
      const next = clampFx(fx, { speed: s.speed, reverb: s.reverb });
      AsyncStorage.setItem(FX_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  },
}));

/**
 * One unreadable or malformed key used to reset every setting to its
 * default. Each key now falls back on its own.
 */
async function readBool(key: string, fallback: boolean): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    return typeof value === 'boolean' ? value : fallback;
  } catch {
    return fallback;
  }
}

async function readFx(): Promise<Fx> {
  try {
    const raw = await AsyncStorage.getItem(FX_KEY);
    if (raw === null) return FX_PRESETS.off;
    const value = JSON.parse(raw) as Partial<Fx> | null;
    return clampFx(value ?? {}, FX_PRESETS.off);
  } catch {
    return FX_PRESETS.off;
  }
}

Promise.all([
  readBool(STORAGE_KEY, true),
  readBool(FAQ_KEY, false),
  readBool(GLASS_KEY, true),
  readBool(GLASS_BLUR_KEY, GLASS_BLUR_DEFAULT),
  readFx(),
]).then(([dynamicAccent, hasSeenFaq, glassMode, glassBlur, fx]) => {
  useSettingsStore.setState({
    dynamicAccent,
    hasSeenFaq,
    glassMode,
    glassBlur,
    speed: fx.speed,
    reverb: fx.reverb,
    _hydrated: true,
  });
});
