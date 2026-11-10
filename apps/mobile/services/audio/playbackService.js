const TrackPlayerModule = require('react-native-track-player');
const TrackPlayer = TrackPlayerModule.default ?? TrackPlayerModule;
const { Event } = TrackPlayerModule;

function getPlayerStore() {
  try {
    return require('../../store/usePlayerStore').usePlayerStore;
  } catch {
    return null;
  }
}

module.exports = async function playbackService() {
  if (!TrackPlayer?.addEventListener || !Event) return;

  // Set while a short interruption holds a track that was playing.
  let resumeAfterInterruption = false;

  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    await TrackPlayer.play();
    getPlayerStore()?.setState({ isPlaying: true });
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    resumeAfterInterruption = false;
    await TrackPlayer.pause();
    getPlayerStore()?.setState({ isPlaying: false });
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    await TrackPlayer.stop();
    getPlayerStore()?.setState({ isPlaying: false });
  });

  // Another app took the audio: a call, a voice message being recorded, a
  // navigation prompt. The player always stops for it (never plays on
  // quietly underneath) and picks up again when a short interruption ends.
  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    if (event.paused || event.permanent) {
      const wasPlaying = getPlayerStore()?.getState().isPlaying ?? false;
      // A permanent loss (another player started) is not resumed.
      resumeAfterInterruption = wasPlaying && !event.permanent;
      await TrackPlayer.pause();
      getPlayerStore()?.setState({ isPlaying: false });
      return;
    }
    if (!resumeAfterInterruption) return;
    resumeAfterInterruption = false;
    await TrackPlayer.play();
    getPlayerStore()?.setState({ isPlaying: true });
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    getPlayerStore()?.getState().skipNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    getPlayerStore()?.getState().skipPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteJumpForward, async () => {
    await TrackPlayer.seekBy(10);
  });

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async () => {
    await TrackPlayer.seekBy(-10);
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, async (event) => {
    await TrackPlayer.seekTo(event.position);
  });
};
