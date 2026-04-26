import { create } from 'zustand';

type OverlayState = {
  isProfileOpen: boolean;
  isSettingsOpen: boolean;
  playlistId: string | null;

  openProfile: () => void;
  closeProfile: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openPlaylist: (id: string) => void;
  closePlaylist: () => void;
  closeAll: () => void;
};

export const useOverlayStore = create<OverlayState>((set) => ({
  isProfileOpen: false,
  isSettingsOpen: false,
  playlistId: null,

  openProfile: () => set({ isProfileOpen: true }),
  closeProfile: () => set({ isProfileOpen: false, isSettingsOpen: false }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  openPlaylist: (id) => set({ playlistId: id }),
  closePlaylist: () => set({ playlistId: null }),
  closeAll: () =>
    set({
      isProfileOpen: false,
      isSettingsOpen: false,
      playlistId: null,
    }),
}));
