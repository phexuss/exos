// Bundles the engine tests (the engine is written for esbuild's resolution) and runs them with node:test.
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

await build({
  entryPoints: ['electron/engine/engine.test.ts'],
  outfile: 'dist-electron/test/engine.test.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  packages: 'external',
  logLevel: 'warning',
});
const r = spawnSync(process.execPath, ['--test', 'dist-electron/test/engine.test.mjs'], { stdio: 'inherit' });
process.exit(r.status ?? 1);
