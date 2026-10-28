import { create } from 'zustand';
import { engine, fileUrl, sourceRequest } from '@/lib/engine';
import { IS_MOCK } from '@/lib/env';
import * as api from '@/lib/services';
import type { Lyrics, Track } from '@/lib/types';
import { useLibrary } from './library';
import { useSettings } from './settings';
import { toast } from './toast';

/** Minimal surface of HTMLAudioElement the player needs; faked in the prototype. */
type AudioLike = {
  src: string;
  currentTime: number;
  duration: number;
  paused: boolean;
  volume: number;
  play: () => Promise<void>;
  pause: () => void;
  addEventListener: (ev: string, fn: () => void) => void;
};

class FakeAudio implements AudioLike {
  src = '';
  currentTime = 0;
  duration = Number.NaN;
  paused = true;
  volume = 1;
  private listeners = new Map<string, Set<() => void>>();
  private timer: ReturnType<typeof setInterval> | null = null;
  fakeDuration = 240;
  addEventListener(ev: string, fn: () => void) {
    if (!this.listeners.has(ev)) this.listeners.set(ev, new Set());
    this.listeners.get(ev)!.add(fn);
  }
  private emit(ev: string) {
    for (const fn of this.listeners.get(ev) ?? []) fn();
  }
  load() {
    this.currentTime = 0;
    this.duration = this.fakeDuration;
    this.emit('loadedmetadata');
  }
  async play() {
    this.paused = false;
    this.emit('play');
    this.timer ??= setInterval(() => {
      this.currentTime += 0.25;
      this.emit('timeupdate');
      if (this.currentTime >= this.duration) {
        this.pause();
        this.emit('ended');
      }
    }, 250);
  }
  pause() {
    this.paused = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.emit('pause');
  }
}

const audio: AudioLike = IS_MOCK ? new FakeAudio() : new Audio();

export type Panel = 'lyrics' | 'queue' | null;
export type Repeat = 'off' | 'all' | 'one';

type PlayerState = {
  queue: Track[];
  /** Order before shuffle, to restore it. */
  originalQueue: Track[] | null;
  index: number;
  current: Track | null;
  status: 'idle' | 'loading' | 'playing' | 'paused';
  /** What the engine is doing while loading, shown under the title. */
  loadingNote: string | null;
  time: number;
  duration: number;
  repeat: Repeat;
  shuffle: boolean;
  panel: Panel;
  nowPlayingOpen: boolean;
  lyrics: Lyrics | null;
  lyricsFor: string | null;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  playTrack: (track: Track) => void;
  playNext: (track: Track) => void;
  addToQueue: (track: Track) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setPanel: (p: Panel) => void;
  togglePanel: (p: Exclude<Panel, null>) => void;
  setNowPlaying: (open: boolean) => void;
  removeFromQueue: (i: number) => void;
};

let loadSeq = 0;
/** Tracks resolved to a playable URL in this session (direct URLs live ~6 h). */
const urlCache = new Map<string, { url: string; at: number }>();
const URL_TTL_MS = 3 * 60 * 60 * 1000;

async function resolvePlayable(track: Track, note: (s: string) => void): Promise<string> {
  const local = useLibrary.getState().get(track.id);
  if (local) return fileUrl(local.filePath);

  const cached = urlCache.get(track.id);
  if (cached && Date.now() - cached.at < URL_TTL_MS) return cached.url;

  const req = sourceRequest(track, useSettings.getState().cookiesBrowser);
  note('yt-dlp ищет источник…');
  const stream = await engine.resolveStream(req);
  let url = stream.url;
  if (stream.protocol.startsWith('m3u8')) {
    // HLS (most SoundCloud tracks now) can't go into <audio> on every
    // platform; yt-dlp + ffmpeg pull it into the cache first.
    note('Собираю трек из HLS…');
    url = await fileUrl(await engine.cacheTrack(track.id, req));
  }
  urlCache.set(track.id, { url, at: Date.now() });
  return url;
}

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const usePlayer = create<PlayerState>((set, get) => {
  const load = async (index: number) => {
    const track = get().queue[index];
    if (!track) return;
    const seq = ++loadSeq;
    set({ index, current: track, status: 'loading', time: 0, duration: track.durationSec, loadingNote: null });
    audio.pause();
    updateMediaSession(track);
    void loadLyrics(track);
    try {
      const url = await resolvePlayable(track, (note) => seq === loadSeq && set({ loadingNote: note }));
      if (seq !== loadSeq) return;
      audio.src = url;
      if (audio instanceof FakeAudio) {
        audio.fakeDuration = track.durationSec;
        audio.load();
      }
      try {
        await audio.play();
      } catch (playError) {
        if (seq !== loadSeq) return;
        if (useLibrary.getState().get(track.id)) throw playError;
        // A direct CDN URL can expire or be refused by the webview's
        // decoder; let yt-dlp pull the file into the cache instead.
        set({ loadingNote: 'Прямая ссылка не сработала, качаю в кеш…' });
        const req = sourceRequest(track, useSettings.getState().cookiesBrowser);
        const cachedUrl = await fileUrl(await engine.cacheTrack(track.id, req));
        if (seq !== loadSeq) return;
        urlCache.set(track.id, { url: cachedUrl, at: Date.now() });
        audio.src = cachedUrl;
        await audio.play();
      }
      api.syncPlayed(track);
    } catch (e) {
      if (seq !== loadSeq) return;
      urlCache.delete(track.id);
      set({ status: 'paused', loadingNote: null });
      toast(`Не получилось включить «${track.title}»: ${e instanceof Error ? e.message : e}`, 'error');
    }
  };

  const loadLyrics = async (track: Track) => {
    const local = useLibrary.getState().get(track.id);
    if (local && (local.syncedLyrics || local.plainLyrics)) {
      set({ lyrics: local, lyricsFor: track.id });
      return;
    }
    set({ lyrics: null, lyricsFor: track.id });
    const lyrics = await api.getLyrics(track);
    if (get().lyricsFor === track.id) set({ lyrics });
  };

  audio.volume = useSettings.getState().volume;
  audio.addEventListener('timeupdate', () => set({ time: audio.currentTime }));
  audio.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audio.duration)) set({ duration: audio.duration });
  });
  audio.addEventListener('play', () => set({ status: 'playing', loadingNote: null }));
  audio.addEventListener('pause', () => {
    if (get().status !== 'loading') set({ status: 'paused' });
  });
  audio.addEventListener('ended', () => {
    const { repeat, index, queue } = get();
    if (repeat === 'one') {
      audio.currentTime = 0;
      void audio.play();
    } else if (index < queue.length - 1) void load(index + 1);
    else if (repeat === 'all' && queue.length) void load(0);
    else set({ status: 'paused' });
  });
  return {
    queue: [],
    originalQueue: null,
    index: -1,
    current: null,
    status: 'idle',
    loadingNote: null,
    time: 0,
    duration: 0,
    repeat: 'off',
    shuffle: false,
    panel: null,
    nowPlayingOpen: false,
    lyrics: null,
    lyricsFor: null,
    playQueue: (tracks, startIndex = 0) => {
      if (!tracks.length) return;
      if (get().shuffle) {
        const first = tracks[startIndex];
        const rest = shuffled(tracks.filter((_, i) => i !== startIndex));
        set({ queue: [first, ...rest], originalQueue: tracks });
        void load(0);
      } else {
        set({ queue: tracks, originalQueue: null });
        void load(startIndex);
      }
    },
    playTrack: (track) => get().playQueue([track], 0),
    playNext: (track) => {
      const { queue, index } = get();
      if (!queue.length) return get().playTrack(track);
      set({ queue: [...queue.slice(0, index + 1), track, ...queue.slice(index + 1)] });
      toast(`Следующим: ${track.title}`);
    },
    addToQueue: (track) => {
      if (!get().queue.length) return get().playTrack(track);
      set((s) => ({ queue: [...s.queue, track] }));
      toast(`В очереди: ${track.title}`);
    },
    toggle: () => {
      const { status, current } = get();
      if (!current) return;
      if (status === 'playing') audio.pause();
      else if (status === 'paused') void audio.play();
    },
    next: () => {
      const { index, queue, repeat } = get();
      if (index < queue.length - 1) void load(index + 1);
      else if (repeat === 'all' && queue.length) void load(0);
    },
    prev: () => {
      const { index } = get();
      if (audio.currentTime > 3 || index === 0) {
        audio.currentTime = 0;
        set({ time: 0 });
      } else void load(index - 1);
    },
    seek: (sec) => {
      audio.currentTime = Math.max(0, Math.min(sec, get().duration || sec));
      set({ time: audio.currentTime });
    },
    setVolume: (v) => {
      audio.volume = v;
      useSettings.getState().set({ volume: v });
    },
    toggleShuffle: () => {
      const { shuffle, queue, index, originalQueue, current } = get();
      if (!shuffle) {
        const rest = shuffled(queue.filter((_, i) => i !== index));
        set({ shuffle: true, originalQueue: queue, queue: current ? [current, ...rest] : rest, index: 0 });
      } else {
        const base = originalQueue ?? queue;
        const at = current ? base.findIndex((t) => t.id === current.id) : 0;
        set({ shuffle: false, originalQueue: null, queue: base, index: Math.max(0, at) });
      }
    },
    cycleRepeat: () =>
      set((s) => ({ repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off' })),
    setPanel: (panel) => set({ panel }),
    togglePanel: (p) => set((s) => ({ panel: s.panel === p ? null : p })),
    setNowPlaying: (open) => set({ nowPlayingOpen: open }),
    removeFromQueue: (i) =>
      set((s) => {
        if (i === s.index) return s;
        const queue = s.queue.filter((_, j) => j !== i);
        return { queue, index: i < s.index ? s.index - 1 : s.index };
      }),
  };
});

function updateMediaSession(track: Track) {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist.name,
      album: track.album ?? '',
      artwork: track.coverUrl ? [{ src: track.coverUrl, sizes: '500x500' }] : [],
    });
    const p = usePlayer.getState();
    navigator.mediaSession.setActionHandler('play', () => p.toggle());
    navigator.mediaSession.setActionHandler('pause', () => p.toggle());
    navigator.mediaSession.setActionHandler('nexttrack', () => usePlayer.getState().next());
    navigator.mediaSession.setActionHandler('previoustrack', () => usePlayer.getState().prev());
  } catch {}
}
