// Bundles the main process, the engine and the preload into one file each, so
// startup reads three files instead of walking node_modules.
import { copyFile, mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

const out = 'dist-electron';
await mkdir(out, { recursive: true });
const common = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  external: ['electron'],
  minify: true,
  legalComments: 'none',
  logLevel: 'info',
};
await Promise.all([
  build({ ...common, entryPoints: ['electron/main.ts'], outfile: `${out}/main.cjs` }),
  build({ ...common, entryPoints: ['electron/engine/index.ts'], outfile: `${out}/engine.cjs` }),
  build({ ...common, entryPoints: ['electron/preload.ts'], outfile: `${out}/preload.cjs`, platform: 'browser' }),
]);
await copyFile('electron/boot.cjs', `${out}/boot.cjs`);
