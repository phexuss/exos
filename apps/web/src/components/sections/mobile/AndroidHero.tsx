'use client';

import { Download, Monitor, PauseCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { usePlatform } from '@/components/providers/PlatformProvider';
import { HeroScreens } from '@/components/sections/hero/HeroScreens';
import { primaryButton, quietButton } from '@/components/shared/buttons';
import { Wordmark } from '@/components/shared/Wordmark';
import { APK_URL } from '@/lib/releases';

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
});

/** The phone app as it was, with its status said up front. */
export function AndroidHero() {
  const t = useTranslations('Android.hero');
  const hero = useTranslations('Hero');
  const { setPlatform } = usePlatform();
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto max-w-275 px-4 pt-12 pb-8 sm:px-6 sm:pt-20"
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <div className="flex max-w-2xl flex-col gap-6">
          <motion.h1
            id="hero-heading"
            {...rise(0)}
            className="select-none font-black text-7xl tracking-[0.06em] leading-[0.9] sm:text-8xl"
          >
            <Wordmark />
          </motion.h1>
          <motion.span
            {...rise(0.1)}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] px-3 py-1 font-medium text-sm text-warning"
          >
            <PauseCircle size={15} />
            {t('badge')}
          </motion.span>
          <motion.p
            {...rise(0.15)}
            className="font-medium text-2xl leading-snug sm:text-3xl"
          >
            {hero('title')}
          </motion.p>
          <motion.p
            {...rise(0.3)}
            className="max-w-[60ch] leading-7 text-text-2 sm:text-lg sm:leading-8"
          >
            {t('description')}
          </motion.p>
          <motion.div
            {...rise(0.45)}
            className="mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
          >
            <a href={APK_URL} className={primaryButton}>
              <Download size={18} />
              {hero('download')}
            </a>
            <button
              type="button"
              onClick={() => {
                setPlatform('desktop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`${quietButton} cursor-pointer`}
            >
              <Monitor size={16} />
              {t('toDesktop')}
            </button>
          </motion.div>
        </div>
        <div className="mt-6 flex w-full justify-center lg:mt-0 lg:w-auto lg:shrink-0">
          <HeroScreens />
        </div>
      </div>
    </section>
  );
}
