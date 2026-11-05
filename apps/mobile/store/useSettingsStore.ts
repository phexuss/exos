import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';

const STORAGE_KEY = 'settings:dynamicAccent';
const FAQ_KEY = 'settings:hasSeenFaq';
const GLASS_KEY = 'settings:glassMode';
const GLASS_BLUR_KEY = 'settings:glassBlur';

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
  _hydrated: boolean;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  dynamicAccent: true,
  hasSeenFaq: false,
  // Same look as the desktop app: glass over the artwork-tinted backdrop.
  glassMode: true,
  glassBlur: GLASS_BLUR_DEFAULT,
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

Promise.all([
  readBool(STORAGE_KEY, true),
  readBool(FAQ_KEY, false),
  readBool(GLASS_KEY, true),
  readBool(GLASS_BLUR_KEY, GLASS_BLUR_DEFAULT),
]).then(([dynamicAccent, hasSeenFaq, glassMode, glassBlur]) => {
  useSettingsStore.setState({
    dynamicAccent,
    hasSeenFaq,
    glassMode,
    glassBlur,
    _hydrated: true,
  });
});
