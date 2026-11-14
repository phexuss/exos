'use client';

import { AnimatePresence, motion } from 'motion/react';
import { usePlatform } from '@/components/providers/PlatformProvider';
import { DesktopFeatures } from '@/components/sections/desktop/DesktopFeatures';
import { DesktopHero } from '@/components/sections/desktop/DesktopHero';
import { Inside } from '@/components/sections/desktop/Inside';
import { LyricsEditing } from '@/components/sections/desktop/LyricsEditing';
import { Showcase } from '@/components/sections/desktop/Showcase';
import { SoundTuning } from '@/components/sections/desktop/SoundTuning';
import { Download } from '@/components/sections/download/Download';
import Faq from '@/components/sections/faq/Faq';
import { AndroidHero } from '@/components/sections/mobile/AndroidHero';
import { MobileFeatures } from '@/components/sections/mobile/MobileFeatures';
import Sources from '@/components/sections/sources/Sources';
import type { Releases } from '@/lib/releases';

/** The page for the app picked in the header: the desktop one by default. */
export function Landing({ releases }: { releases: Releases }) {
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
            <DesktopHero release={releases.desktop} />
            <DesktopFeatures />
            <Showcase />
            <LyricsEditing />
            <SoundTuning />
            <Inside />
          </>
        ) : (
          <>
            <AndroidHero android={releases.android} />
            <MobileFeatures />
          </>
        )}
        <Sources />
        <Download releases={releases} />
        <Faq />
      </motion.div>
    </AnimatePresence>
  );
}
