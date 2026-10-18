import 'expo-router/entry';
import { NativeModules } from 'react-native';

// react-native-track-player reads its native module while its JS is being
// imported, so requiring it where the module isn't compiled in (Expo Go)
// throws "Cannot read property 'CAPABILITY_PLAY' of null". Check first.
if (NativeModules.TrackPlayerModule) {
  const TrackPlayerModule = require('react-native-track-player');
  const TrackPlayer = TrackPlayerModule.default ?? TrackPlayerModule;

  TrackPlayer.registerPlaybackService(() =>
    require('./services/audio/playbackService'),
  );
} else if (__DEV__) {
  console.warn(
    '[Audio] TrackPlayer native module is missing (Expo Go?). Playback needs a dev or release build.',
  );
}
