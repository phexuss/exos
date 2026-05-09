import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  images: {
    qualities: [100, 25, 50, 75],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
