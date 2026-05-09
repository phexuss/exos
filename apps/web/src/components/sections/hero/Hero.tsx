'use client';

import * as motion from 'motion/react-client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import DownloadButton from '@/components/motion/DownloadButton';
import GithubButton from '@/components/motion/GithubButton';
import { HeroScreens } from './HeroScreens';

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const wordVariants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.7,
      ease: easeOutCubic,
    },
  },
};

const fadeUpVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: 'blur(6px)',
  },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      delay,
      ease: easeOutCubic,
    },
  }),
};

export default function Hero() {
  const t = useTranslations('Hero');
  const titleWordItems = t('title')
    .split(' ')
    .map((word, index) => ({
      word,
      key: `${word}-${index}`,
    }));

  return (
    <section
      aria-labelledby="hero-heading"
      className="pt-12  sm:pt-16  sm:pb-14 lg:pt-20 lg:pb-26.5 max-w-275 mx-auto px-4 sm:px-6 "
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-20">
        <div className="max-w-2xl">
          <div className="flex flex-col gap-6">
            <motion.h1
              id="hero-heading"
              initial={{ opacity: 0, y: 30, filter: 'blur(14px)', scale: 0.96 }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
              transition={{ duration: 1, ease: easeOutCubic }}
              className="relative text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-medium select-none"
            >
              <span
                className="bg-linear-to-r from-white via-sidebar-primary to-white bg-clip-text text-transparent [text-shadow:0_0_80px_rgba(129,140,248,0.45),0_0_160px_rgba(99,102,241,0.25)]"
                style={{
                  backgroundSize: '200% auto',
                  animation: 'shimmer 3.5s linear infinite',
                }}
              >
                EXØS
              </span>
            </motion.h1>

            <motion.p
              className="text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight flex flex-wrap gap-x-[0.35em]"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {titleWordItems.map((item) => (
                <motion.span key={item.key} variants={wordVariants}>
                  {item.word}
                </motion.span>
              ))}
            </motion.p>

            <motion.p
              className="max-w-xl text-sm sm:text-base leading-7 sm:leading-8 text-chart-4"
              custom={0.55}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
            >
              {t('description')}
            </motion.p>

            <motion.div
              className="mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5"
              custom={0.75}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
            >
              <Link href="#" target="_blank">
                <DownloadButton />
              </Link>

              <Link href="https://github.com/phexuss/exos" target="_blank">
                <GithubButton />
              </Link>
            </motion.div>
          </div>
        </div>
        <div className="flex w-full justify-center mt-12 lg:mt-0 lg:w-auto lg:shrink-0">
          <HeroScreens />
        </div>
      </div>
    </section>
  );
}
