const { withMainActivity } = require('expo/config-plugins');

// Android lets many OEM skins (MIUI/HyperOS, ColorOS, some Samsung modes) keep
// an app at 60 Hz unless the window asks for a faster display mode. This asks
// for the panel's fastest mode at the current resolution (90/120/144 Hz) when
// the activity starts. The system still drops the rate when idle or in
// battery saver, so it costs nothing while nothing moves.
const MARKER = '// exos: high refresh rate';

const SNIPPET = `
    ${MARKER}
    @Suppress("DEPRECATION")
    val exosDisplay = windowManager.defaultDisplay
    val exosMode = exosDisplay.mode
    exosDisplay.supportedModes
      .filter {
        it.physicalWidth == exosMode.physicalWidth &&
          it.physicalHeight == exosMode.physicalHeight
      }
      .maxByOrNull { it.refreshRate }
      ?.takeIf { it.modeId != exosMode.modeId }
      ?.let { best ->
        window.attributes = window.attributes.apply { preferredDisplayModeId = best.modeId }
      }`;

module.exports = function withHighRefreshRate(config) {
  return withMainActivity(config, (cfg) => {
    const { modResults } = cfg;
    if (modResults.language !== 'kt') {
      throw new Error('withHighRefreshRate: expected a Kotlin MainActivity');
    }
    if (modResults.contents.includes(MARKER)) return cfg;

    const anchor = /super\.onCreate\([^)]*\)/;
    if (!anchor.test(modResults.contents)) {
      throw new Error(
        'withHighRefreshRate: super.onCreate() not found in MainActivity',
      );
    }
    modResults.contents = modResults.contents.replace(
      anchor,
      (match) => `${match}${SNIPPET}`,
    );
    return cfg;
  });
};
