import { create } from 'zustand';

export type DownloadProgress = {
  progress: number;
  status: 'fetching_url' | 'downloading' | 'done' | 'error';
};

type DownloadStoreState = {
  downloadedIds: Set<string>;

  activeDownloads: Record<string, DownloadProgress>;

  markDownloaded: (trackId: string) => void;

  markRemoved: (trackId: string) => void;

  setDownloadedIds: (ids: string[]) => void;

  setDownloadProgress: (
    trackId: string,
    progress: number,
    status: DownloadProgress['status'],
  ) => void;

  clearDownloadProgress: (trackId: string) => void;

  revision: number;
};

export const useDownloadStore = create<DownloadStoreState>((set) => ({
  downloadedIds: new Set(),
  activeDownloads: {},
  revision: 0,

  markDownloaded: (trackId) =>
    set((s) => {
      const next = new Set(s.downloadedIds);
      next.add(trackId);
      const { [trackId]: _, ...rest } = s.activeDownloads;
      return {
        downloadedIds: next,
        activeDownloads: rest,
        revision: s.revision + 1,
      };
    }),

  markRemoved: (trackId) =>
    set((s) => {
      const next = new Set(s.downloadedIds);
      next.delete(trackId);
      return { downloadedIds: next, revision: s.revision + 1 };
    }),

  setDownloadedIds: (ids) =>
    set((s) => ({
      downloadedIds: new Set(ids),
      revision: s.revision + 1,
    })),

  setDownloadProgress: (trackId, progress, status) =>
    set((s) => ({
      activeDownloads: {
        ...s.activeDownloads,
        [trackId]: { progress, status },
      },
      revision: s.revision + 1,
    })),

  clearDownloadProgress: (trackId) =>
    set((s) => {
      const { [trackId]: _, ...rest } = s.activeDownloads;
      return { activeDownloads: rest, revision: s.revision + 1 };
    }),
}));
