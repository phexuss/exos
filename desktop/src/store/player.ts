import { create } from 'zustand';
import { engine, fileUrl, rememberSource, rememberedSource, type ResolvedStream, sourceRequest } from '@/lib/engine';
import { t } from '@/i18n';
import { IS_MOCK } from '@/lib/env';
import { createFx } from '@/lib/fx';
import * as api from '@/lib/services';
import type { Lyrics, Track } from '@/lib/types';
import { useLibrary } from './library';
import { useUserLyrics } from './lyrics';
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

/**
 * Two elements, so a crossfade can start the next track on one while the
 * other fades out. `audio` is the one that plays the current track; the other
 * is idle, or is the tail of the previous track during a crossfade.
 */
const elements: AudioLike[] = IS_MOCK ? [new FakeAudio(), new FakeAudio()] : [new Audio(), new Audio()];
let audio: AudioLike = elements[0];
const other = () => (audio === elements[0] ? elements[1] : elements[0]);
// Effects run the audio through Web Audio, which hears a cross-origin element
// only when it was loaded with CORS; the engine's media server allows it.
if (!IS_MOCK) for (const el of elements) (el as HTMLAudioElement).crossOrigin = 'anonymous';
const fx = IS_MOCK ? null : createFx(elements as HTMLAudioElement[]);

/** The previous track fading out during a crossfade. */
let tail: { el: AudioLike; timer: ReturnType<typeof setTimeout> } | null = null;
function stopTail() {
  if (!tail) return;
  clearTimeout(tail.timer);
  tail.el.pause();
  tail = null;
}

/** Listens on both elements, but only to the one playing the current track. */
function on(ev: string, fn: () => void) {
  for (const el of elements) el.addEventListener(ev, () => el === audio && fn());
}

function soundSettings() {
  const s = useSettings.getState();
  return {
    fx: { speed: s.speed, reverb: s.reverb },
    eqOn: s.eqOn,
    eq: s.eq,
    normalize: s.normalize,
    crossfade: s.crossfadeOn ? s.crossfadeSec : 0,
  };
}

/**
 * Slider position (0..1) to the element's gain. Loudness is heard on a log
 * scale, so a linear gain puts nearly all of the range in the first tenth of
 * the slider. The cube is the curve the system mixers on Linux (PulseAudio,
 * PipeWire) use: 50% is about -18 dB and 1% is next to silence.
 */
const gain = (v: number) => Math.max(0, Math.min(1, v)) ** 3;
const setOutput = (v: number) => (fx ? fx.setVolume(gain(v)) : (audio.volume = gain(v)));

/** The visualizer's analysers (null in the browser mock, which has no real audio). */
export const audioTaps = () => fx?.taps() ?? null;

/** The playhead right now, for things drawn every frame. */
export const playhead = () => audio.currentTime;

export type Panel = 'lyrics' | 'queue' | null;
export type Repeat = 'off' | 'all' | 'one';

type PlayerState = {
  queue: Track[];
  /** Order before shuffle, to restore it. */
  originalQueue: Track[] | null;
  /**
   * The list playback was started from (a playlist, an album, the library).
   * When the queue runs out with repeat off, it goes on with this list
   * shuffled, again and again, the way Spotify does.
   */
  context: Track[];
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
  /** Jumps to a place in the current queue, keeping the queue and its list as they are. */
  playAt: (index: number) => void;
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
  /** Reads the current track's lyrics again, after the user set or dropped their own. */
  reloadLyrics: () => void;
};

let loadSeq = 0;
let nowPlayingCloser: (() => Promise<void>) | null = null;
let nowPlayingClosing = false;
/** The full-window view registers its exit animation here while it is mounted. */
export function registerNowPlayingCloser(fn: (() => Promise<void>) | null) {
  nowPlayingCloser = fn;
}
/** Tracks resolved to a playable URL in this session. */
const urlCache = new Map<string, { url: string; at: number; ttl: number }>();
/** YouTube links live ~6 h; SoundCloud signs its CDN links for minutes, and re-resolving it is quick. */
const URL_TTL_MS = 3 * 60 * 60 * 1000;
const SC_URL_TTL_MS = 4 * 60 * 1000;
/** Local files (library, stream cache) stay valid for the session. */
const FILE_TTL_MS = Number.POSITIVE_INFINITY;

/** Resolves running right now, so a prefetch and a click share one yt-dlp run. */
const inFlight = new Map<string, Promise<string>>();

async function resolveRemote(track: Track, note: (s: string) => void): Promise<string> {
  const cached = urlCache.get(track.id);
  if (cached && Date.now() - cached.at < cached.ttl) return cached.url;
  const running = inFlight.get(track.id);
  if (running) return running;

  const run = (async () => {
    const browser = useSettings.getState().cookiesBrowser;
    const remembered = rememberedSource(track.id);
    let stream: ResolvedStream;
    try {
      stream = await engine.resolveStream(sourceRequest(track, browser));
    } catch (e) {
      if (!remembered) throw e;
      // The remembered video may be gone; search again.
      rememberSource(track.id, undefined);
      stream = await engine.resolveStream(sourceRequest(track, browser));
    }
    if (stream.sourceUrl && track.source !== 'soundcloud') rememberSource(track.id, stream.sourceUrl);
    let url = stream.url;
    let ttl = stream.protocol === 'file' ? FILE_TTL_MS : track.source === 'soundcloud' ? SC_URL_TTL_MS : URL_TTL_MS;
    if (stream.protocol.startsWith('m3u8')) {
      // HLS that only yt-dlp could resolve: pull it into the cache first.
      note(t('player.stitchingHls'));
      url = await fileUrl(await engine.cacheTrack(track.id, sourceRequest(track, browser)));
      ttl = FILE_TTL_MS;
    }
    urlCache.set(track.id, { url, at: Date.now(), ttl });
    return url;
  })();
  inFlight.set(track.id, run);
  try {
    return await run;
  } finally {
    inFlight.delete(track.id);
  }
}

async function resolvePlayable(track: Track, note: (s: string) => void): Promise<string> {
  const local = useLibrary.getState().get(track.id);
  if (local) return fileUrl(local.filePath);
  note(track.source === 'soundcloud' ? t('player.gettingSc') : t('player.ytdlpLooking'));
  return resolveRemote(track, note);
}

/** Resolves the next track while this one plays, so skipping starts at once. */
let prefetchTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePrefetch(next: Track | undefined) {
  if (prefetchTimer) clearTimeout(prefetchTimer);
  if (!next || IS_MOCK || useLibrary.getState().get(next.id)) return;
  prefetchTimer = setTimeout(() => {
    void resolveRemote(next, () => {}).catch(() => {});
  }, 4000);
}

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** One more pass over the list, shuffled, never opening with the track that just played. */
export function nextRound(context: Track[], lastId: string | undefined): Track[] {
  const round = shuffled(context);
  if (round.length > 1 && round[0].id === lastId) {
    const swap = 1 + Math.floor(Math.random() * (round.length - 1));
    [round[0], round[swap]] = [round[swap], round[0]];
  }
  return round;
}

export const usePlayer = create<PlayerState>((set, get) => {
  /**
   * On the last track of the queue, with repeat off, the next round of the
   * list joins the queue now, so "Up next" is never empty while a list plays.
   * A single track (played from search) has no list to go on with.
   */
  const extend = () => {
    const { queue, index, repeat, context } = get();
    if (repeat !== 'off' || context.length < 2 || index < queue.length - 1) return;
    set({ queue: [...queue, ...nextRound(context, queue[index]?.id)] });
  };

  /**
   * Plays queue[index]. With `crossfadeSec`, the track that is playing keeps
   * going on its element and fades out once the next one starts on the other.
   */
  const load = async (index: number, crossfadeSec = 0) => {
    const track = get().queue[index];
    if (!track) return;
    const seq = ++loadSeq;
    const prev = audio;
    stopTail();
    if (crossfadeSec > 0 && fx?.canFade()) {
      audio = other();
      fx.fade(audio as HTMLAudioElement, 0, 0);
    } else {
      prev.pause();
      fx?.fade(audio as HTMLAudioElement, 1, 0);
    }
    const fading = audio !== prev;
    set({ index, current: track, status: 'loading', time: 0, duration: track.durationSec, loadingNote: null });
    extend();
    audio.pause();
    updateMediaSession(track);
    void loadLyrics(track);
    try {
      const url = await resolvePlayable(track, (note) => seq === loadSeq && set({ loadingNote: note }));
      if (seq !== loadSeq) return;
      audio.src = url;
      fx?.track(audio as HTMLAudioElement, track.id);
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
        set({ loadingNote: t('player.cachingInstead') });
        const req = sourceRequest(track, useSettings.getState().cookiesBrowser);
        const cachedUrl = await fileUrl(await engine.cacheTrack(track.id, req));
        if (seq !== loadSeq) return;
        urlCache.set(track.id, { url: cachedUrl, at: Date.now(), ttl: FILE_TTL_MS });
        audio.src = cachedUrl;
        await audio.play();
      }
      if (fading && fx) {
        // Both are playing now: the new one comes in as the old one goes.
        fx.fade(audio as HTMLAudioElement, 1, crossfadeSec);
        fx.fade(prev as HTMLAudioElement, 0, crossfadeSec);
        tail = { el: prev, timer: setTimeout(stopTail, crossfadeSec * 1000 + 200) };
      }
      api.syncPlayed(track);
    } catch (e) {
      if (seq !== loadSeq) return;
      if (fading) prev.pause();
      urlCache.delete(track.id);
      set({ status: 'paused', loadingNote: null });
      toast(
        t('player.playFailed', {
          title: track.title,
          error: e instanceof Error ? e.message : String(e),
        }),
        'error',
      );
    }
  };

  const loadLyrics = async (track: Track) => {
    const mine = useUserLyrics.getState().get(track.id);
    if (mine) {
      set({ lyrics: mine, lyricsFor: track.id });
      return;
    }
    const local = useLibrary.getState().get(track.id);
    if (local && (local.syncedLyrics || local.plainLyrics)) {
      set({ lyrics: local, lyricsFor: track.id });
      return;
    }
    set({ lyrics: null, lyricsFor: track.id });
    const lyrics = await api.getLyrics(track);
    if (get().lyricsFor === track.id) set({ lyrics });
  };

  setOutput(useSettings.getState().volume);
  fx?.setSound(soundSettings());
  useSettings.subscribe((s, p) => {
    if (
      s.speed !== p.speed ||
      s.reverb !== p.reverb ||
      s.eqOn !== p.eqOn ||
      s.eq !== p.eq ||
      s.normalize !== p.normalize ||
      s.crossfadeOn !== p.crossfadeOn ||
      s.crossfadeSec !== p.crossfadeSec
    )
      fx?.setSound(soundSettings());
  });

  /** The queue position that comes after this one, the same way 'ended' picks it. */
  const nextIndex = (): number | null => {
    const { repeat, index, queue } = get();
    if (repeat === 'one') return null;
    if (index < queue.length - 1) return index + 1;
    if (repeat === 'all' && queue.length > 1) return 0;
    extend();
    return get().index < get().queue.length - 1 ? get().index + 1 : null;
  };

  on('timeupdate', () => {
    set({ time: audio.currentTime });
    // Crossfade: start the next track a few seconds before this one ends.
    const { crossfadeOn, crossfadeSec } = useSettings.getState();
    const sec = crossfadeOn ? crossfadeSec : 0;
    const { status, duration } = get();
    if (sec <= 0 || status !== 'playing' || !fx?.canFade()) return;
    // The file's own length when it agrees with the catalogue; HLS stitched
    // from chunks can report a few seconds, and then the catalogue is right.
    const file = Number.isFinite(audio.duration) ? audio.duration : 0;
    const length = file > 0 && (duration <= 0 || Math.abs(file - duration) <= duration * 0.15) ? file : duration;
    // Short tracks get a shorter overlap, never more than a third of the track.
    const overlap = Math.min(sec, length / 3);
    if (length <= 0 || length - audio.currentTime > overlap || overlap < 1) return;
    const next = nextIndex();
    if (next !== null) void load(next, overlap);
  });
  // The catalogue knows the real length; files stitched from HLS chunks can
  // report a few seconds, so the file only wins when the catalogue has nothing.
  const syncDuration = () => {
    const known = get().current?.durationSec ?? 0;
    if (known > 0 || !Number.isFinite(audio.duration)) return;
    set({ duration: audio.duration });
  };
  on('loadedmetadata', syncDuration);
  on('durationchange', syncDuration);
  on('play', () => {
    // An audio context made before any click starts suspended; playing is the click.
    fx?.reapply();
    set({ status: 'playing', loadingNote: null });
    const { queue, index, repeat } = get();
    schedulePrefetch(queue[index + 1] ?? (repeat === 'all' ? queue[0] : undefined));
  });
  on('pause', () => {
    if (get().status !== 'loading') set({ status: 'paused' });
  });
  // A CDN link can stop answering mid-track (expired signature, a refused
  // range). Resolve a fresh one once and carry on from the same spot.
  let recoveredFor: string | null = null;
  on('error', () => {
    const { current, status, time } = get();
    if (!current || status === 'loading' || IS_MOCK || useLibrary.getState().get(current.id)) return;
    if (recoveredFor === current.id) return;
    recoveredFor = current.id;
    const seq = loadSeq;
    const wasPlaying = status === 'playing';
    urlCache.delete(current.id);
    void resolveRemote(current, () => {})
      .then((url) => {
        if (seq !== loadSeq) return;
        audio.src = url;
        audio.currentTime = time;
        if (wasPlaying) return audio.play();
      })
      .catch(() => {
        if (seq === loadSeq) set({ status: 'paused' });
      });
  });
  on('ended', () => {
    const { repeat, index, queue } = get();
    if (repeat === 'one') {
      audio.currentTime = 0;
      void audio.play();
    } else if (index < queue.length - 1) void load(index + 1);
    else if (repeat === 'all' && queue.length) void load(0);
    else {
      extend();
      if (get().index < get().queue.length - 1) void load(get().index + 1);
      else set({ status: 'paused' });
    }
  });
  return {
    queue: [],
    originalQueue: null,
    context: [],
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
        set({ queue: [first, ...rest], originalQueue: tracks, context: tracks });
        void load(0);
      } else {
        set({ queue: tracks, originalQueue: null, context: tracks });
        void load(startIndex);
      }
    },
    playTrack: (track) => get().playQueue([track], 0),
    playAt: (index) => void load(index),
    playNext: (track) => {
      const { queue, index } = get();
      if (!queue.length) return get().playTrack(track);
      set({
        queue: [...queue.slice(0, index + 1), track, ...queue.slice(index + 1)],
      });
      toast(t('player.playingNext', { title: track.title }));
    },
    addToQueue: (track) => {
      if (!get().queue.length) return get().playTrack(track);
      set((s) => ({ queue: [...s.queue, track] }));
      toast(t('player.queued', { title: track.title }));
    },
    toggle: () => {
      const { status, current } = get();
      if (!current) return;
      if (status === 'playing') {
        stopTail();
        audio.pause();
      } else if (status === 'paused') void audio.play();
    },
    next: () => {
      const { index, queue, repeat } = get();
      if (index < queue.length - 1) void load(index + 1);
      else if (repeat === 'all' && queue.length) void load(0);
      else {
        extend();
        if (get().index < get().queue.length - 1) void load(get().index + 1);
      }
    },
    prev: () => {
      const { index } = get();
      if (audio.currentTime > 3 || index === 0) {
        audio.currentTime = 0;
        set({ time: 0 });
      } else void load(index - 1);
    },
    seek: (sec) => {
      stopTail();
      audio.currentTime = Math.max(0, Math.min(sec, get().duration || sec));
      set({ time: audio.currentTime });
    },
    setVolume: (v) => {
      setOutput(v);
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
    cycleRepeat: () => {
      set((s) => ({ repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off' }));
      // Back to off on the last track: line up the next round right away.
      extend();
    },
    setPanel: (panel) => set({ panel }),
    togglePanel: (p) => set((s) => ({ panel: s.panel === p ? null : p })),
    setNowPlaying: (open) => {
      if (!open && get().nowPlayingOpen && nowPlayingCloser && !nowPlayingClosing) {
        // Let the full-window view animate out before it unmounts.
        nowPlayingClosing = true;
        void nowPlayingCloser().finally(() => {
          nowPlayingClosing = false;
          set({ nowPlayingOpen: false });
        });
        return;
      }
      if (!nowPlayingClosing) set({ nowPlayingOpen: open });
    },
    reloadLyrics: () => {
      const { current } = get();
      if (current) void loadLyrics(current);
    },
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
