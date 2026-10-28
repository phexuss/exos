import { create } from 'zustand';
import { type DownloadProgress, engine, listen, onMockProgress, sourceRequest } from '@/lib/engine';
import { IS_MOCK } from '@/lib/env';
import { exampleTracks } from '@/lib/mock';
import * as api from '@/lib/services';
import type { LocalTrack, Track } from '@/lib/types';
import { useSettings } from './settings';
import { toast } from './toast';

export type DownloadJob = {
  track: Track;
  stage: DownloadProgress['stage'] | 'queued';
  progress: number;
  speed?: string;
  eta?: string;
  error?: string;
  startedAt: number;
};

type LibraryState = {
  tracks: LocalTrack[];
  loaded: boolean;
  /** Keyed by track id; finished jobs stay until cleared so the panel shows history. */
  jobs: Record<string, DownloadJob>;
  load: () => Promise<void>;
  isDownloaded: (id: string) => boolean;
  get: (id: string) => LocalTrack | undefined;
  download: (track: Track) => void;
  downloadMany: (tracks: Track[]) => void;
  cancel: (id: string) => void;
  remove: (id: string) => Promise<void>;
  clearFinished: () => void;
};

const MAX_PARALLEL = 2;
let defaultMusicDir = '';

export const useLibrary = create<LibraryState>((set, get) => {
  const save = () => {
    void engine.writeLibrary(get().tracks).catch(() => {});
  };

  const patchJob = (id: string, patch: Partial<DownloadJob>) =>
    set((s) => (s.jobs[id] ? { jobs: { ...s.jobs, [id]: { ...s.jobs[id], ...patch } } } : s));

  const onProgress = (p: DownloadProgress) =>
    patchJob(p.id, { stage: p.stage, progress: p.progress, speed: p.speed, eta: p.eta });

  if (IS_MOCK) onMockProgress(onProgress);
  else void listen<DownloadProgress>('download://progress', onProgress);

  const pump = () => {
    const jobs = Object.values(get().jobs);
    const running = jobs.filter((j) => ['resolving', 'downloading', 'converting'].includes(j.stage));
    const next = jobs
      .filter((j) => j.stage === 'queued')
      .sort((a, b) => a.startedAt - b.startedAt)
      .slice(0, Math.max(0, MAX_PARALLEL - running.length));
    for (const job of next) void run(job.track);
  };

  const run = async (track: Track) => {
    patchJob(track.id, { stage: 'resolving', progress: 0 });
    const settings = useSettings.getState();
    try {
      const [result, lyrics] = await Promise.all([
        engine.download({
          ...sourceRequest(track, settings.cookiesBrowser),
          id: track.id,
          title: track.title,
          artist: track.artist.name,
          album: track.album,
          format: track.source === 'soundcloud' ? 'mp3' : settings.format,
          dir: settings.musicDir ?? defaultMusicDir,
        }),
        api.getLyrics(track),
      ]);
      const local: LocalTrack = {
        ...track,
        filePath: result.filePath,
        format: result.format,
        downloadedAt: Date.now(),
        syncedLyrics: lyrics?.syncedLyrics ?? null,
        plainLyrics: lyrics?.plainLyrics ?? null,
      };
      set((s) => ({ tracks: [local, ...s.tracks.filter((t) => t.id !== track.id)] }));
      patchJob(track.id, { stage: 'done', progress: 1 });
      save();
      api.syncDownload(track);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (get().jobs[track.id]) {
        patchJob(track.id, { stage: 'error', error: message });
        toast(`Не скачалось: ${track.title}. ${message}`, 'error');
      }
    } finally {
      pump();
    }
  };

  return {
    tracks: [],
    loaded: false,
    jobs: {},
    load: async () => {
      const status = await engine.status().catch(() => null);
      defaultMusicDir = status?.musicDir ?? '';
      if (IS_MOCK) {
        const tracks: LocalTrack[] = exampleTracks.slice(0, 9).map((t, i) => ({
          ...t,
          filePath: `~/Music/EXØS/${t.artist.name} - ${t.title}.m4a`,
          format: 'm4a',
          downloadedAt: Date.now() - i * 86_400_000 * 1.7,
        }));
        set({ tracks, loaded: true });
        return;
      }
      const tracks = (await engine.readLibrary().catch(() => null)) ?? [];
      set({ tracks, loaded: true });
    },
    isDownloaded: (id) => get().tracks.some((t) => t.id === id),
    get: (id) => get().tracks.find((t) => t.id === id),
    download: (track) => {
      const job = get().jobs[track.id];
      if (get().isDownloaded(track.id)) return;
      if (job && job.stage !== 'error' && job.stage !== 'done') return;
      set((s) => ({
        jobs: { ...s.jobs, [track.id]: { track, stage: 'queued', progress: 0, startedAt: Date.now() } },
      }));
      pump();
    },
    downloadMany: (tracks) => {
      const fresh = tracks.filter((t) => !get().isDownloaded(t.id));
      for (const t of fresh) get().download(t);
      if (fresh.length > 1) toast(`В очереди на скачивание: ${fresh.length}`);
    },
    cancel: (id) => {
      void engine.cancel(id);
      set((s) => {
        const jobs = { ...s.jobs };
        delete jobs[id];
        return { jobs };
      });
      pump();
    },
    remove: async (id) => {
      const track = get().get(id);
      if (track) await engine.deleteFile(track.filePath).catch(() => {});
      set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) }));
      save();
    },
    clearFinished: () =>
      set((s) => ({
        jobs: Object.fromEntries(
          Object.entries(s.jobs).filter(([, j]) => j.stage !== 'done' && j.stage !== 'error'),
        ),
      })),
  };
});
