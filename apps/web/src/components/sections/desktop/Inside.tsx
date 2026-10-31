'use client';

import { HardDrive, Server } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from '@/components/motion/scrollReveal';

/** Where the work happens: the computer does the audio, the server the rest. */
export function Inside() {
  const t = useTranslations('Desktop.inside');
  const local = t.raw('local.items') as string[];
  const server = t.raw('server.items') as string[];
  return (
    <motion.section
      id="how"
      className="mx-auto flex max-w-275 flex-col gap-6 px-4 py-16 sm:px-6 sm:py-24"
      variants={revealContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <motion.div
        variants={revealItemVariants}
        className="flex max-w-[64ch] flex-col gap-3"
      >
        <h2 className="font-bold text-3xl sm:text-4xl">{t('title')}</h2>
        <p className="leading-7 text-text-2">{t('lead')}</p>
      </motion.div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <motion.div
          variants={revealItemVariants}
          className="pane flex flex-col gap-5 rounded-pane p-6 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_45%,transparent)] sm:p-8"
        >
          <h3 className="flex items-center gap-3 font-medium text-xl">
            <HardDrive size={20} className="text-primary" />
            {t('local.title')}
          </h3>
          <ul className="flex flex-col gap-3">
            {local.map((item) => (
              <li key={item} className="flex items-center gap-3 text-base">
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          variants={revealItemVariants}
          className="pane flex flex-col gap-5 rounded-pane p-6 sm:p-8"
        >
          <h3 className="flex items-center gap-3 font-medium text-xl text-text-2">
            <Server size={20} />
            {t('server.title')}
          </h3>
          <ul className="flex flex-col gap-3">
            {server.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-base text-text-2"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-text-3" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </motion.section>
  );
}
