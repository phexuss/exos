import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'settings:dynamicAccent';

type SettingsState = {
  dynamicAccent: boolean;
  setDynamicAccent: (enabled: boolean) => void;
  _hydrated: boolean;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  dynamicAccent: true,
  _hydrated: false,

  setDynamicAccent: (enabled) => {
    set({ dynamicAccent: enabled });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled)).catch(() => {});
  },
}));

// Hydrate from storage on init
AsyncStorage.getItem(STORAGE_KEY)
  .then((raw) => {
    if (raw !== null) {
      useSettingsStore.setState({
        dynamicAccent: JSON.parse(raw),
        _hydrated: true,
      });
    } else {
      useSettingsStore.setState({ _hydrated: true });
    }
  })
  .catch(() => {
    useSettingsStore.setState({ _hydrated: true });
  });
