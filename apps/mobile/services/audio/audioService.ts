import type { AudioPlayer, AudioStatus } from 'expo-audio';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

let player: AudioPlayer | null = null;
let statusSub: { remove: () => void } | null = null;
let positionInterval: ReturnType<typeof setInterval> | null = null;
let isSeeking = false;
let isReplacing = false;
let replaceStartedAt = 0;
let replaceWatchdog: ReturnType<typeof setTimeout> | null = null;
let didHandleFinish = false;
let lastSeekTime = 0;

const SEEK_PROGRESS_FREEZE_MS = 250;
const MIN_REPLACE_FREEZE_MS = 300;
const MAX_REPLACE_FREEZE_MS = 2500;

let _getStore:
  | (() => typeof import('@/store/usePlayerStore').usePlayerStore)
  | null = null;

export function bindStore(
  getter: () => typeof import('@/store/usePlayerStore').usePlayerStore,
) {
  _getStore = getter;
}

export function getDuration(): number {
  const track = _getStore?.()?.getState().currentTrack;
  return (
    positiveSeconds(track?.durationSec) || positiveSeconds(player?.duration)
  );
}

function store() {
  if (!_getStore) throw new Error('audioService: store not bound');
  return _getStore();
}

function positiveSeconds(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value;
}

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function resetTransientPlaybackState() {
  isSeeking = false;
  lastSeekTime = 0;
}

function clearReplaceWatchdog() {
  if (replaceWatchdog) {
    clearTimeout(replaceWatchdog);
    replaceWatchdog = null;
  }
}

function finishReplace() {
  isReplacing = false;
  replaceStartedAt = 0;
  clearReplaceWatchdog();
}

function beginReplace() {
  resetTransientPlaybackState();
  isReplacing = true;
  replaceStartedAt = Date.now();
  clearReplaceWatchdog();
  store().setState({ progress: 0 });
  replaceWatchdog = setTimeout(finishReplace, MAX_REPLACE_FREEZE_MS);
}

function isReplaceSettled(currentTime: number): boolean {
  const elapsedMs = Date.now() - replaceStartedAt;
  if (elapsedMs < MIN_REPLACE_FREEZE_MS) return false;

  const elapsedSec = elapsedMs / 1000;
  return currentTime <= Math.max(2, elapsedSec + 0.75);
}

function warnAudioError(message: string, error: unknown): void {
  if (__DEV__) console.warn(message, error);
}

function playAfterSeek(p: AudioPlayer): void {
  try {
    p.play();
  } catch (error) {
    warnAudioError('[Audio] replay failed:', error);
  }
}

function getPlayer(): AudioPlayer {
  if (!player) {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
    player = createAudioPlayer();

    statusSub = player.addListener(
      'playbackStatusUpdate',
      (status: AudioStatus) => {
        const s = store();
        if (status.playing && !s.getState().isPlaying) {
          s.setState({ isPlaying: true });
        }

        if (!status.didJustFinish) {
          didHandleFinish = false;
          return;
        }

        if (didHandleFinish) return;
        didHandleFinish = true;

        const p = player;
        if (!p) return;

        const { repeat } = s.getState();
        if (repeat === 'one') {
          s.setState({ progress: 0 });
          void p
            .seekTo(0)
            .then(() => playAfterSeek(p))
            .catch((error: unknown) =>
              warnAudioError('[Audio] repeat seek failed:', error),
            );
        } else {
          s.getState().skipNext();
        }
      },
    );
  }
  return player;
}

function startPositionTracking() {
  stopPositionTracking();
  positionInterval = setInterval(() => {
    if (isSeeking || !player) return;
    if (!store().getState().isPlaying) return;

    if (Date.now() - lastSeekTime < SEEK_PROGRESS_FREEZE_MS) {
      return;
    }

    const currentTime = Number.isFinite(player.currentTime)
      ? player.currentTime
      : 0;

    if (isReplacing) {
      if (!isReplaceSettled(currentTime)) return;
      finishReplace();
    }

    const duration = getDuration();
    if (!duration) return;

    store().setState({ progress: clampRatio(currentTime / duration) });
  }, 250);
}

function stopPositionTracking() {
  if (positionInterval) {
    clearInterval(positionInterval);
    positionInterval = null;
  }
}

function activateLockScreen(p: AudioPlayer): void {
  if (typeof p.setActiveForLockScreen !== 'function') return;
  try {
    const track = store().getState().currentTrack;
    if (!track) return;
    p.setActiveForLockScreen(true, {
      title: track.title,
      artist: track.artist.name,
      artworkUrl: track.coverUrl,
    });
  } catch {
    // Lock screen controls not available (e.g. Expo Go)
  }
}

export function playUrl(url: string): void {
  const p = getPlayer();
  if (__DEV__) console.log('[Audio] Playing URL:', url);
  beginReplace();
  p.replace({ uri: url });
  p.play();
  activateLockScreen(p);
  startPositionTracking();
}

export function playLocalFile(filePath: string): void {
  const p = getPlayer();
  if (__DEV__) console.log('[Audio] Playing local:', filePath);
  beginReplace();
  p.replace({ uri: filePath });
  p.play();
  activateLockScreen(p);
  startPositionTracking();
}

export function pauseAudio(): void {
  player?.pause();
  stopPositionTracking();
}

export function resumeAudio(): void {
  player?.play();
  startPositionTracking();
}

export function seekTo(ratio: number): void {
  const p = player;
  if (!p) return;

  const duration = getDuration();
  if (!duration) return;

  const nextRatio = clampRatio(ratio);
  lastSeekTime = Date.now();
  const targetTime = nextRatio * duration;

  void p
    .seekTo(targetTime)
    .then(() => {
      lastSeekTime = 0;
    })
    .catch((error: unknown) => {
      warnAudioError('[Audio] seek failed:', error);
    });
}

export function startSeeking(): void {
  isSeeking = true;
}

export function stopSeeking(): void {
  isSeeking = false;
}

export function releaseAudio(): void {
  stopPositionTracking();
  statusSub?.remove();
  statusSub = null;
  try {
    player?.pause();
  } catch {}
  try {
    player?.remove();
  } catch {}
  player = null;
  resetTransientPlaybackState();
  finishReplace();
  didHandleFinish = false;
  if (_getStore) {
    try {
      store().setState({
        currentTrack: null,
        isPlaying: false,
        progress: 0,
        queue: [],
        showQueue: false,
        isPlayerOpen: false,
      });
    } catch {}
  }
}
