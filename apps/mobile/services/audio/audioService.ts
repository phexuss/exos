import type { AudioPlayer, AudioStatus } from 'expo-audio';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

let player: AudioPlayer | null = null;
let statusSub: { remove: () => void } | null = null;
let positionInterval: ReturnType<typeof setInterval> | null = null;
let isSeeking = false;
let isAdvancing = false;
let pendingSeekRatio: number | null = null;
let pendingSeekTimer: ReturnType<typeof setTimeout> | null = null;

let _getStore:
  | (() => typeof import('@/store/usePlayerStore').usePlayerStore)
  | null = null;

export function bindStore(
  getter: () => typeof import('@/store/usePlayerStore').usePlayerStore,
) {
  _getStore = getter;
}

function store() {
  if (!_getStore) throw new Error('audioService: store not bound');
  return _getStore();
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
        if (!status.didJustFinish || isAdvancing) return;
        isAdvancing = true;
        const s = store();
        const { repeat } = s.getState();
        if (repeat === 'one') {
          player?.seekTo(0);
          player?.play();
          s.setState({ progress: 0 });
          isAdvancing = false;
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
    const duration = player.duration;
    const currentTime = player.currentTime;
    if (duration <= 0) return;
    const ratio = currentTime / duration;
    if (pendingSeekRatio !== null) {
      // Wait until expo-audio finishes seeking before resuming progress writes
      if (Math.abs(ratio - pendingSeekRatio) < 0.02) {
        pendingSeekRatio = null;
        if (pendingSeekTimer) {
          clearTimeout(pendingSeekTimer);
          pendingSeekTimer = null;
        }
      } else {
        return;
      }
    }
    store().setState({ progress: ratio });
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
  p.replace({ uri: url });
  p.play();
  isAdvancing = false;
  activateLockScreen(p);
  startPositionTracking();
}

export function playLocalFile(filePath: string): void {
  const p = getPlayer();
  if (__DEV__) console.log('[Audio] Playing local:', filePath);
  p.replace({ uri: filePath });
  p.play();
  isAdvancing = false;
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
  if (!player || !player.duration) return;
  pendingSeekRatio = ratio;
  if (pendingSeekTimer) clearTimeout(pendingSeekTimer);
  // Safety net in case expo-audio never reports the new currentTime
  pendingSeekTimer = setTimeout(() => {
    pendingSeekRatio = null;
    pendingSeekTimer = null;
  }, 1500);
  player.seekTo(ratio * player.duration);
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
  isSeeking = false;
  isAdvancing = false;
  pendingSeekRatio = null;
  if (pendingSeekTimer) {
    clearTimeout(pendingSeekTimer);
    pendingSeekTimer = null;
  }
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
