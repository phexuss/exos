import { create } from 'zustand';

export type OverlayTool = 'ytdlp-lab' | 'youtube-login';

type OverlayState = {
  isProfileOpen: boolean;
  isSettingsOpen: boolean;
  isFaqOpen: boolean;
  /** A page pushed over Settings: the yt-dlp lab or the YouTube sign-in. */
  tool: OverlayTool | null;
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
  openTool: (tool: OverlayTool) => void;
  closeTool: () => void;
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
  tool: null,
  playlistId: null,
  artistId: null,
  albumId: null,
  albumTitle: null,

  openProfile: () => set({ isProfileOpen: true }),
  closeProfile: () =>
    set({ isProfileOpen: false, isSettingsOpen: false, tool: null }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false, tool: null }),
  openFaq: () => set({ isFaqOpen: true }),
  closeFaq: () => set({ isFaqOpen: false }),
  openTool: (tool) => set({ tool }),
  closeTool: () => set({ tool: null }),
  openPlaylist: (id) => set({ playlistId: id }),
  closePlaylist: () => set({ playlistId: null }),
  // Clears the album: an artist opened from an album's track list would
  // otherwise load underneath it.
  openArtist: (id) => set({ artistId: id, albumId: null, albumTitle: null }),
  closeArtist: () => set({ artistId: null, albumId: null, albumTitle: null }),
  openAlbum: (id, title) => set({ albumId: id, albumTitle: title ?? null }),
  closeAlbum: () => set({ albumId: null, albumTitle: null }),
  closeAll: () =>
    set({
      isProfileOpen: false,
      isSettingsOpen: false,
      isFaqOpen: false,
      tool: null,
      playlistId: null,
      artistId: null,
      albumId: null,
      albumTitle: null,
    }),
}));
