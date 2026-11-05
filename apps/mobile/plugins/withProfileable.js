const { withAndroidManifest } = require('expo/config-plugins');

// Marks the release app as profileable by the shell (Android 10+), so
// `simpleperf` / Perfetto can sample its threads over adb without a debug
// build. It grants nothing to other apps and doesn't make the app debuggable.
module.exports = function withProfileable(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;
    const entry = { $: { 'android:shell': 'true' } };
    const existing = app.profileable ?? [];
    if (!existing.some((p) => p.$?.['android:shell'] === 'true')) {
      app.profileable = [...existing, entry];
    }
    return cfg;
  });
};
