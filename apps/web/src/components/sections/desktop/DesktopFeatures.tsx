'use client';

import {
  AudioLines,
  Cloud,
  Cpu,
  FolderOpen,
  ListMusic,
  SlidersHorizontal,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from '@/components/motion/scrollReveal';

const ITEMS = [
  { key: 'engine', icon: Cpu },
  { key: 'files', icon: FolderOpen },
  { key: 'playlists', icon: ListMusic },
  { key: 'sound', icon: SlidersHorizontal },
  { key: 'lyrics', icon: AudioLines },
  { key: 'cloud', icon: Cloud },
] as const;

/** One pane of rows, laid out like a group in the app's settings. */
export function DesktopFeatures() {
  const t = useTranslations('Desktop.features');
  return (
    <motion.section
      id="features"
      className="mx-auto flex max-w-275 flex-col gap-6 px-4 py-16 sm:px-6 sm:py-24"
      variants={revealContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <motion.h2
        variants={revealItemVariants}
        className="font-bold text-3xl sm:text-4xl"
      >
        {t('title')}
      </motion.h2>
      <motion.div
        variants={revealItemVariants}
        className="pane grid grid-cols-1 overflow-hidden rounded-pane md:grid-cols-2"
      >
        {ITEMS.map(({ key, icon: Icon }, i) => (
          <div
            key={key}
            className={[
              'flex gap-4 p-6 sm:p-7',
              i > 0 ? 'border-t border-rim' : '',
              i === 1 ? 'md:border-t-0' : '',
              i % 2 === 1 ? 'md:border-l md:border-rim' : '',
            ].join(' ')}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-fill-2 text-primary">
              <Icon size={20} />
            </span>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-medium text-lg">{t(`${key}.title`)}</h3>
              <p className="text-sm leading-6 text-text-2">
                {t(`${key}.text`)}
              </p>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.section>
  );
}
