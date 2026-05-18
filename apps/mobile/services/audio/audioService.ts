import type { Track as PlayerTrack } from 'react-native-track-player';

type TrackPlayerModule = typeof import('react-native-track-player');
type TrackPlayerApi = TrackPlayerModule['default'];

type PlaybackSourceOptions = {
  contentType?: string;
};

let positionInterval: ReturnType<typeof setInterval> | null = null;
let isSeeking = false;
let isReplacing = false;
let replaceStartedAt = 0;
let replaceWatchdog: ReturnType<typeof setTimeout> | null = null;
let lastSeekTime = 0;
let setupPromise: Promise<TrackPlayerApi> | null = null;
let subscriptionsBound = false;
let lastKnownDuration = 0;
let progressPollInFlight = false;
let trackPlayerModule: TrackPlayerModule | null = null;
let trackPlayerApi: TrackPlayerApi | null = null;
let lastPlaybackUri: string | null = null;
let lastPlaybackLabel: string | null = null;

const SEEK_PROGRESS_FREEZE_MS = 250;
const MIN_REPLACE_FREEZE_MS = 300;
const MAX_REPLACE_FREEZE_MS = 2500;
const MEDIA_NOTIFICATION_COLOR = 0xff121212;
const MEDIA_NOTIFICATION_ICON =
  require('../../assets/images/notification-icon.png') as number;

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
    positiveSeconds(track?.durationSec) || positiveSeconds(lastKnownDuration)
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

function isReplaceSettled(position: number): boolean {
  const elapsedMs = Date.now() - replaceStartedAt;
  if (elapsedMs < MIN_REPLACE_FREEZE_MS) return false;

  const elapsedSec = elapsedMs / 1000;
  return position <= Math.max(2, elapsedSec + 0.75);
}

function warnAudioError(message: string, error: unknown): void {
  // Always log — we need to see playback failures in production via adb logcat
  // (e.g. expo-audio/RNTP 403 from IP-bound googlevideo URLs). console.warn is
  // forwarded to native logs in both dev and release Hermes builds.
  console.warn(message, error);
}

function loadTrackPlayerModule(): TrackPlayerModule | null {
  if (trackPlayerModule && trackPlayerApi) return trackPlayerModule;

  try {
    const mod = require('react-native-track-player') as TrackPlayerModule & {
      default?: TrackPlayerApi;
    };
    const api = mod.default ?? (mod as unknown as TrackPlayerApi);
    if (!api?.setupPlayer || !api?.addEventListener) {
      throw new Error('react-native-track-player native module is unavailable');
    }
    trackPlayerModule = mod;
    trackPlayerApi = api;
    return mod;
  } catch (error) {
    warnAudioError('[Audio] TrackPlayer unavailable:', error);
    return null;
  }
}

function getTrackPlayer(): TrackPlayerApi | null {
  loadTrackPlayerModule();
  return trackPlayerApi;
}

function bindTrackPlayerEvents() {
  if (subscriptionsBound) return;
  const trackPlayer = getTrackPlayer();
  const trackPlayerModule = loadTrackPlayerModule();
  if (!trackPlayer || !trackPlayerModule) return;

  const { Event, State } = trackPlayerModule;
  subscriptionsBound = true;

  trackPlayer.addEventListener(Event.PlaybackState, ({ state }) => {
    if (state === State.Playing) {
      finishReplace();
      store().setState({ isPlaying: true });
      startPositionTracking();
      return;
    }

    if (
      state === State.Loading ||
      state === State.Buffering ||
      state === State.Ready
    ) {
      return;
    }

    if (
      isReplacing &&
      (state === State.Paused ||
        state === State.Stopped ||
        state === State.Ended ||
        state === State.None)
    ) {
      return;
    }

    if (
      state === State.Paused ||
      state === State.Stopped ||
      state === State.Ended ||
      state === State.None ||
      state === State.Error
    ) {
      store().setState({ isPlaying: false });
      if (state !== State.Paused) stopPositionTracking();
    }
  });

  trackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
    if (isReplacing) return;

    const s = store();
    const { repeat } = s.getState();
    if (repeat === 'one') {
      s.setState({ progress: 0 });
      void trackPlayer
        .seekTo(0)
        .then(() => trackPlayer.play())
        .catch((error: unknown) =>
          warnAudioError('[Audio] repeat seek failed:', error),
        );
      return;
    }
    s.getState().skipNext();
  });

  trackPlayer.addEventListener(Event.PlaybackError, (error) => {
    // Include the URI that was loaded into the player so we can correlate
    // RNTP/ExoPlayer/AVPlayer errors with the resolved stream URL on the
    // server side (see DownloadService.resolveDirectUrl logs).
    warnAudioError(
      `[Audio] playback error (label=${lastPlaybackLabel ?? 'unknown'} uri=${
        lastPlaybackUri ?? 'unknown'
      }):`,
      error,
    );
    store().setState({ isPlaying: false });
    stopPositionTracking();
  });
}

async function ensurePlayer(): Promise<TrackPlayerApi> {
  const trackPlayer = getTrackPlayer();
  const trackPlayerModule = loadTrackPlayerModule();
  if (!trackPlayer || !trackPlayerModule) {
    throw new Error('TrackPlayer is not available in this runtime');
  }

  if (!setupPromise) {
    const { AppKilledPlaybackBehavior, Capability } = trackPlayerModule;
    setupPromise = trackPlayer
      .setupPlayer({
        autoHandleInterruptions: true,
        autoUpdateMetadata: true,
      })
      .then(() =>
        trackPlayer.updateOptions({
          android: {
            appKilledPlaybackBehavior:
              AppKilledPlaybackBehavior.ContinuePlayback,
          },
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
            Capability.JumpForward,
            Capability.JumpBackward,
            Capability.Stop,
          ],
          notificationCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
            Capability.JumpForward,
            Capability.JumpBackward,
            Capability.Stop,
          ],
          compactCapabilities: [
            Capability.SkipToPrevious,
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
          ],
          color: MEDIA_NOTIFICATION_COLOR,
          icon: MEDIA_NOTIFICATION_ICON,
          forwardJumpInterval: 10,
          backwardJumpInterval: 10,
          progressUpdateEventInterval: 1,
        }),
      )
      .then(() => {
        bindTrackPlayerEvents();
        return trackPlayer;
      })
      .catch((error: unknown) => {
        setupPromise = null;
        throw error;
      });
  }

  return setupPromise;
}

function buildPlayerTrack(
  uri: string,
  options: PlaybackSourceOptions = {},
): PlayerTrack {
  const currentTrack = store().getState().currentTrack;
  if (!currentTrack) {
    return {
      id: uri,
      url: uri,
      title: 'Unknown track',
      artist: 'Unknown artist',
      contentType: options.contentType,
    };
  }

  lastKnownDuration = positiveSeconds(currentTrack.durationSec);

  return {
    id: currentTrack.id,
    url: uri,
    title: currentTrack.title,
    artist: currentTrack.artist.name,
    album: currentTrack.album,
    artwork: currentTrack.coverUrl,
    duration: lastKnownDuration || undefined,
    contentType: options.contentType,
  };
}

function startPositionTracking() {
  stopPositionTracking();
  positionInterval = setInterval(() => {
    if (isSeeking || progressPollInFlight) return;
    if (!store().getState().isPlaying) return;

    if (Date.now() - lastSeekTime < SEEK_PROGRESS_FREEZE_MS) {
      return;
    }

    const trackPlayer = getTrackPlayer();
    if (!trackPlayer) return;

    progressPollInFlight = true;
    void trackPlayer
      .getProgress()
      .then(({ position, duration }) => {
        if (positiveSeconds(duration)) {
          lastKnownDuration = duration;
        }

        if (isReplacing) {
          if (!isReplaceSettled(position)) return;
          finishReplace();
        }

        const trackDuration = getDuration();
        if (!trackDuration) return;

        store().setState({
          progress: clampRatio(position / trackDuration),
        });
      })
      .catch((error: unknown) =>
        warnAudioError('[Audio] progress polling failed:', error),
      )
      .finally(() => {
        progressPollInFlight = false;
      });
  }, 250);
}

function stopPositionTracking() {
  if (positionInterval) {
    clearInterval(positionInterval);
    positionInterval = null;
  }
}

async function playSource(
  uri: string,
  label: string,
  options: PlaybackSourceOptions = {},
): Promise<void> {
  // Log unconditionally so failed playback attempts on production builds are
  // visible in adb logcat alongside the corresponding PlaybackError event.
  console.warn(`[Audio] Playing ${label}:`, uri);
  lastPlaybackUri = uri;
  lastPlaybackLabel = label;
  beginReplace();

  try {
    const trackPlayer = await ensurePlayer();
    await trackPlayer.reset();
    await trackPlayer.load(buildPlayerTrack(uri, options));
    await trackPlayer.play();
    startPositionTracking();
  } catch (error) {
    finishReplace();
    warnAudioError('[Audio] playback start failed:', error);
    try {
      store().setState({ isPlaying: false });
    } catch {}
  }
}

export function playUrl(
  url: string,
  options: PlaybackSourceOptions = {},
): void {
  void playSource(url, 'URL', options);
}

export function playLocalFile(filePath: string): void {
  void playSource(filePath, 'local');
}

export function pauseAudio(): void {
  const trackPlayer = getTrackPlayer();
  if (!trackPlayer) return;

  void trackPlayer
    .pause()
    .catch((error: unknown) => warnAudioError('[Audio] pause failed:', error));
  stopPositionTracking();
}

export function resumeAudio(): void {
  void ensurePlayer()
    .then((trackPlayer) => trackPlayer.play())
    .then(startPositionTracking)
    .catch((error: unknown) => warnAudioError('[Audio] resume failed:', error));
}

export function seekTo(ratio: number): void {
  const duration = getDuration();
  if (!duration) return;

  const nextRatio = clampRatio(ratio);
  lastSeekTime = Date.now();
  const targetTime = nextRatio * duration;
  const trackPlayer = getTrackPlayer();
  if (!trackPlayer) return;

  void trackPlayer
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
  const trackPlayer = getTrackPlayer();
  if (trackPlayer) {
    void trackPlayer
      .reset()
      .catch((error: unknown) =>
        warnAudioError('[Audio] reset failed:', error),
      );
  }
  resetTransientPlaybackState();
  finishReplace();
  lastKnownDuration = 0;
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
