// Entry for both the main process and the engine: turns on Node's on-disk
// compile cache first, so the bundles after the first launch start from
// cached bytecode instead of being parsed and compiled again.
const path = require('node:path');
try {
  // The engine can't ask Electron for paths; the main process passes its folder down.
  const dir = process.env.EXOS_V8_CACHE || path.join(require('electron').app.getPath('userData'), 'v8-cache');
  process.env.EXOS_V8_CACHE = dir;
  require('node:module').enableCompileCache(dir);
} catch {}
require(process.env.EXOS_ENTRY === 'engine' ? './engine.cjs' : './main.cjs');
