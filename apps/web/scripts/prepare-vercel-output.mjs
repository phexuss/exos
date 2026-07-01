import {
  copyFileSync,
  existsSync,
  lstatSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.VERCEL !== '1') {
  process.exit(0);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const repoRoot = resolve(appRoot, '../..');
const appNextDir = resolve(appRoot, '.next');
const repoNextDir = resolve(repoRoot, '.next');

function resetRootNextLink() {
  if (repoNextDir === appNextDir) {
    return;
  }

  try {
    const stat = lstatSync(repoNextDir);

    if (stat.isSymbolicLink()) {
      rmSync(repoNextDir, { force: true });
    } else {
      rmSync(repoNextDir, { force: true, recursive: true });
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  symlinkSync(relative(repoRoot, appNextDir), repoNextDir, 'dir');
}

function ensureDeterministicRoutesManifest() {
  const routesManifest = resolve(appNextDir, 'routes-manifest.json');
  const deterministicRoutesManifest = resolve(
    appNextDir,
    'routes-manifest-deterministic.json',
  );

  if (existsSync(routesManifest) && !existsSync(deterministicRoutesManifest)) {
    copyFileSync(routesManifest, deterministicRoutesManifest);
  }
}

// Vercel Git deployments with Root Directory can finalize from the repository
// root. Keep that lookup pointed at the real Next output in apps/web.
resetRootNextLink();
ensureDeterministicRoutesManifest();
