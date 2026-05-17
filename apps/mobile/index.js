import 'expo-router/entry';

try {
  const TrackPlayerModule = require('react-native-track-player');
  const TrackPlayer = TrackPlayerModule.default ?? TrackPlayerModule;

  TrackPlayer.registerPlaybackService(() =>
    require('./services/audio/playbackService'),
  );
} catch (error) {
  if (__DEV__) console.warn('[Audio] TrackPlayer service unavailable:', error);
}
