import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'settings:dynamicAccent';
const FAQ_KEY = 'settings:hasSeenFaq';

type SettingsState = {
  dynamicAccent: boolean;
  setDynamicAccent: (enabled: boolean) => void;
  hasSeenFaq: boolean;
  setHasSeenFaq: (seen: boolean) => void;
  _hydrated: boolean;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  dynamicAccent: true,
  hasSeenFaq: false,
  _hydrated: false,

  setDynamicAccent: (enabled) => {
    set({ dynamicAccent: enabled });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled)).catch(() => {});
  },

  setHasSeenFaq: (seen) => {
    set({ hasSeenFaq: seen });
    AsyncStorage.setItem(FAQ_KEY, JSON.stringify(seen)).catch(() => {});
  },
}));

Promise.all([
  AsyncStorage.getItem(STORAGE_KEY),
  AsyncStorage.getItem(FAQ_KEY),
])
  .then(([accentRaw, faqRaw]) => {
    useSettingsStore.setState({
      dynamicAccent: accentRaw !== null ? JSON.parse(accentRaw) : true,
      hasSeenFaq: faqRaw !== null ? JSON.parse(faqRaw) : false,
      _hydrated: true,
    });
  })
  .catch(() => {
    useSettingsStore.setState({ _hydrated: true });
  });
