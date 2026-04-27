import { create } from 'zustand';

type OverlayState = {
  isProfileOpen: boolean;
  isSettingsOpen: boolean;
  isFaqOpen: boolean;
  playlistId: string | null;
  artistId: string | null;
  albumId: string | null;
  albumTitle: string | null;

  openProfile: () => void;
  closeProfile: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openFaq: () => void;
  closeFaq: () => void;
  openPlaylist: (id: string) => void;
  closePlaylist: () => void;
  openArtist: (id: string) => void;
  closeArtist: () => void;
  openAlbum: (id: string, title?: string) => void;
  closeAlbum: () => void;
  closeAll: () => void;
};

export const useOverlayStore = create<OverlayState>((set) => ({
  isProfileOpen: false,
  isSettingsOpen: false,
  isFaqOpen: false,
  playlistId: null,
  artistId: null,
  albumId: null,
  albumTitle: null,

  openProfile: () => set({ isProfileOpen: true }),
  closeProfile: () => set({ isProfileOpen: false, isSettingsOpen: false }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  openFaq: () => set({ isFaqOpen: true }),
  closeFaq: () => set({ isFaqOpen: false }),
  openPlaylist: (id) => set({ playlistId: id }),
  closePlaylist: () => set({ playlistId: null }),
  openArtist: (id) => set({ artistId: id }),
  closeArtist: () => set({ artistId: null, albumId: null, albumTitle: null }),
  openAlbum: (id, title) => set({ albumId: id, albumTitle: title ?? null }),
  closeAlbum: () => set({ albumId: null, albumTitle: null }),
  closeAll: () =>
    set({
      isProfileOpen: false,
      isSettingsOpen: false,
      isFaqOpen: false,
      playlistId: null,
      artistId: null,
      albumId: null,
      albumTitle: null,
    }),
}));
