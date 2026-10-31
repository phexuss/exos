'use client';

import { ArrowDown, Download } from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useRef } from 'react';
import { primaryButton, quietButton } from '@/components/shared/buttons';
import { Wordmark } from '@/components/shared/Wordmark';
import type { DesktopRelease } from '@/lib/releases';
import { useOs } from '@/lib/useOs';

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function DesktopHero({ release }: { release: DesktopRelease | null }) {
  const t = useTranslations('Desktop');
  const locale = useLocale();
  const os = useOs();
  const shot = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  // The window leans back under the text and straightens as it scrolls up.
  const { scrollYProgress } = useScroll({
    target: shot,
    offset: ['start end', 'start 25%'],
  });
  const tilt = useTransform(scrollYProgress, [0, 1], [still ? 0 : 22, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [still ? 1 : 0.92, 1]);

  // Linux has two files; the AppImage is the one that runs without unpacking.
  const file =
    os === 'win'
      ? 'win'
      : os === 'mac'
        ? 'mac'
        : os === 'linux'
          ? 'appimage'
          : null;
  const direct = file ? release?.assets[file] : undefined;

  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto max-w-275 px-4 pt-12 sm:px-6 sm:pt-20"
    >
      <div className="flex flex-col gap-6">
        <motion.h1
          id="hero-heading"
          {...rise(0)}
          className="select-none font-black text-7xl tracking-[0.06em] leading-[0.9] sm:text-8xl lg:text-9xl"
        >
          <Wordmark />
        </motion.h1>
        <motion.p
          {...rise(0.15)}
          className="max-w-[30ch] font-medium text-2xl leading-snug sm:text-3xl"
        >
          {t('hero.tagline')}
        </motion.p>
        <motion.p
          {...rise(0.3)}
          className="max-w-[60ch] text-base leading-7 text-text-2 sm:text-lg sm:leading-8"
        >
          {t('hero.description')}
        </motion.p>
        <motion.div
          {...rise(0.45)}
          className="mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
        >
          {direct && os ? (
            <a href={direct.url} className={primaryButton}>
              <Download size={18} />
              {t('hero.downloadFor', { os: t(`os.${os}`) })}
            </a>
          ) : (
            <a href="#download" className={primaryButton}>
              <Download size={18} />
              {t('hero.downloadGeneric')}
            </a>
          )}
          <a href="#download" className={quietButton}>
            {t('hero.otherSystems')}
            <ArrowDown size={16} />
          </a>
        </motion.div>
        <motion.p
          {...rise(0.55)}
          className="text-xs font-medium uppercase tracking-[0.08em] text-text-3"
        >
          {release
            ? t('hero.meta', { version: release.version })
            : t('hero.metaNoVersion')}
          <span aria-hidden="true"> · </span>
          {t('hero.sources')}
        </motion.p>
      </div>

      <div className="mt-14 [perspective:1600px] sm:mt-20" ref={shot}>
        <motion.div
          style={{ rotateX: tilt, scale, transformOrigin: '50% 0%' }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="pane overflow-hidden rounded-shell"
        >
          <Image
            src={`/desktop/home-${locale === 'ru' ? 'ru' : 'en'}.jpg`}
            alt={t('hero.shotAlt')}
            width={2160}
            height={1350}
            priority
            sizes="(min-width: 1100px) 1052px, 100vw"
            className="block h-auto w-full"
          />
        </motion.div>
      </div>
    </section>
  );
}
