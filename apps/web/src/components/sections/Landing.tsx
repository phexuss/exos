'use client';

import { AnimatePresence, motion } from 'motion/react';
import { usePlatform } from '@/components/providers/PlatformProvider';
import { DesktopFeatures } from '@/components/sections/desktop/DesktopFeatures';
import { DesktopHero } from '@/components/sections/desktop/DesktopHero';
import { Inside } from '@/components/sections/desktop/Inside';
import { Showcase } from '@/components/sections/desktop/Showcase';
import { Download } from '@/components/sections/download/Download';
import Faq from '@/components/sections/faq/Faq';
import Features from '@/components/sections/features/Features';
import { AndroidHero } from '@/components/sections/mobile/AndroidHero';
import Sources from '@/components/sections/sources/Sources';
import type { DesktopRelease } from '@/lib/releases';

/** The page for the app picked in the header: the desktop one by default. */
export function Landing({ release }: { release: DesktopRelease | null }) {
  const { platform } = usePlatform();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={platform}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {platform === 'desktop' ? (
          <>
            <DesktopHero release={release} />
            <DesktopFeatures />
            <Showcase />
            <Inside />
          </>
        ) : (
          <>
            <AndroidHero />
            <Features />
          </>
        )}
        <Sources />
        <Download release={release} />
        <Faq />
      </motion.div>
    </AnimatePresence>
  );
}
