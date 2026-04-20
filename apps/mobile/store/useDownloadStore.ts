import { create } from 'zustand';

type DownloadStoreState = {
  /** Set of track IDs that are confirmed downloaded */
  downloadedIds: Set<string>;
  /** Mark a track as downloaded */
  markDownloaded: (trackId: string) => void;
  /** Mark a track as removed (no longer downloaded) */
  markRemoved: (trackId: string) => void;
  /** Bulk-set downloaded IDs (e.g. from DB on init) */
  setDownloadedIds: (ids: string[]) => void;
  /** Revision counter — bumped on every change to trigger re-renders */
  revision: number;
};

export const useDownloadStore = create<DownloadStoreState>((set) => ({
  downloadedIds: new Set(),
  revision: 0,

  markDownloaded: (trackId) =>
    set((s) => {
      const next = new Set(s.downloadedIds);
      next.add(trackId);
      return { downloadedIds: next, revision: s.revision + 1 };
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
}));
