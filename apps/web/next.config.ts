import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const appRoot = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = join(appRoot, '../..');
const projectRoot = existsSync(join(monorepoRoot, 'pnpm-lock.yaml'))
  ? monorepoRoot
  : appRoot;

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  images: {
    qualities: [100, 25, 50, 75],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
