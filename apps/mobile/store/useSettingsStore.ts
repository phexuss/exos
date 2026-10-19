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
  glassMode: false,
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

Promise.all([
  AsyncStorage.getItem(STORAGE_KEY),
  AsyncStorage.getItem(FAQ_KEY),
  AsyncStorage.getItem(GLASS_KEY),
  AsyncStorage.getItem(GLASS_BLUR_KEY),
])
  .then(([accentRaw, faqRaw, glassRaw, glassBlurRaw]) => {
    useSettingsStore.setState({
      dynamicAccent: accentRaw !== null ? JSON.parse(accentRaw) : true,
      hasSeenFaq: faqRaw !== null ? JSON.parse(faqRaw) : false,
      glassMode: glassRaw !== null ? JSON.parse(glassRaw) : false,
      glassBlur:
        glassBlurRaw !== null ? JSON.parse(glassBlurRaw) : GLASS_BLUR_DEFAULT,
      _hydrated: true,
    });
  })
  .catch(() => {
    useSettingsStore.setState({ _hydrated: true });
  });
