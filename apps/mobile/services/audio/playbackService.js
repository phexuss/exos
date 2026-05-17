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

  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    await TrackPlayer.play();
    getPlayerStore()?.setState({ isPlaying: true });
  });

  TrackPlayer.addEventListener(Event.RemotePause, async () => {
    await TrackPlayer.pause();
    getPlayerStore()?.setState({ isPlaying: false });
  });

  TrackPlayer.addEventListener(Event.RemoteStop, async () => {
    await TrackPlayer.stop();
    getPlayerStore()?.setState({ isPlaying: false });
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
