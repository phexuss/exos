import type { AudioPlayer, AudioStatus } from 'expo-audio';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

let player: AudioPlayer | null = null;
let statusSub: { remove: () => void } | null = null;
let positionInterval: ReturnType<typeof setInterval> | null = null;
let isSeeking = false;
let didHandleFinish = false;
let lastSeekTime = 0;

const SEEK_PROGRESS_FREEZE_MS = 1000;

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
        if (!status.didJustFinish) {
          didHandleFinish = false;
          return;
        }

        if (didHandleFinish) return;
        didHandleFinish = true;

        const p = player;
        if (!p) return;

        const s = store();
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

    const duration = getDuration();
    if (!duration) return;

    const currentTime = Number.isFinite(player.currentTime)
      ? player.currentTime
      : 0;
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
  resetTransientPlaybackState();
  store().setState({ progress: 0 });
  p.replace({ uri: url });
  p.play();
  activateLockScreen(p);
  startPositionTracking();
}

export function playLocalFile(filePath: string): void {
  const p = getPlayer();
  if (__DEV__) console.log('[Audio] Playing local:', filePath);
  resetTransientPlaybackState();
  store().setState({ progress: 0 });
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

  void p.seekTo(targetTime).catch((error: unknown) => {
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
