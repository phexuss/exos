'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import {
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from '@/components/motion/scrollReveal';

const SHOTS = [
  { key: 'player', file: 'now-playing' },
  { key: 'cloud', file: 'cloud' },
] as const;

/** Two screens of the app, each with a line on what it is, on alternating sides. */
export function Showcase() {
  const t = useTranslations('Desktop.showcase');
  const lang = useLocale() === 'ru' ? 'ru' : 'en';
  return (
    <section className="mx-auto flex max-w-275 flex-col gap-16 px-4 py-8 sm:gap-24 sm:px-6 sm:py-12">
      {SHOTS.map(({ key, file }, i) => (
        <motion.div
          key={key}
          className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12"
          variants={revealContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
        >
          <motion.div
            variants={revealItemVariants}
            className={`pane overflow-hidden rounded-shell ${i % 2 ? 'lg:order-2' : ''}`}
          >
            <Image
              src={`/desktop/${file}-${lang}.jpg`}
              alt={t(`${key}.alt`)}
              width={2400}
              height={1424}
              sizes="(min-width: 1100px) 640px, 100vw"
              className="block h-auto w-full"
            />
          </motion.div>
          <motion.div
            variants={revealItemVariants}
            className="flex flex-col gap-3"
          >
            <h2 className="font-bold text-3xl">{t(`${key}.title`)}</h2>
            <p className="leading-7 text-text-2">{t(`${key}.text`)}</p>
          </motion.div>
        </motion.div>
      ))}
    </section>
  );
}
