const {
  withAndroidManifest,
  withGradleProperties,
} = require('expo/config-plugins');

// youtubedl-android runs Python, QuickJS and ffmpeg as executables out of the
// app's native library folder, so the .so files must be extracted on install
// instead of being mapped straight from the APK.
function withLegacyJniPackaging(config) {
  return withGradleProperties(config, (cfg) => {
    const key = 'expo.useLegacyPackaging';
    const props = cfg.modResults.filter(
      (item) => !(item.type === 'property' && item.key === key),
    );
    props.push({ type: 'property', key, value: 'true' });
    cfg.modResults = props;
    return cfg;
  });
}

function withExtractNativeLibs(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) throw new Error('withYtdlp: <application> not found');
    app.$['android:extractNativeLibs'] = 'true';
    return cfg;
  });
}

module.exports = function withYtdlp(config) {
  return withExtractNativeLibs(withLegacyJniPackaging(config));
};
