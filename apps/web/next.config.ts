import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
  images: {
    qualities: [100, 25, 50, 75],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
