import { create } from 'zustand';

export type DownloadProgress = {
  progress: number;
  status: 'fetching_url' | 'downloading' | 'done' | 'error';
};

type DownloadStoreState = {
  /** Set of track IDs that are confirmed downloaded */
  downloadedIds: Set<string>;
  /** Active download progress keyed by trackId */
  activeDownloads: Record<string, DownloadProgress>;
  /** Mark a track as downloaded */
  markDownloaded: (trackId: string) => void;
  /** Mark a track as removed (no longer downloaded) */
  markRemoved: (trackId: string) => void;
  /** Bulk-set downloaded IDs (e.g. from DB on init) */
  setDownloadedIds: (ids: string[]) => void;
  /** Update download progress for a track */
  setDownloadProgress: (
    trackId: string,
    progress: number,
    status: DownloadProgress['status'],
  ) => void;
  /** Remove download progress entry (cleanup) */
  clearDownloadProgress: (trackId: string) => void;
  /** Revision counter — bumped on every change to trigger re-renders */
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
