import * as motion from 'motion/react-client';
import Link from 'next/link';

import { useTranslations } from 'next-intl';
import DownloadButton from '@/components/motion/DownloadButton';
import GithubButton from '@/components/motion/GithubButton';
export default function Hero() {
  const t = useTranslations('Hero');
  return (
    <section aria-labelledby="hero-heading" className="py-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-20 px-6">
        <div className="max-w-2xl">
          <div className="flex flex-col gap-6">
            <motion.h1
              initial={{
                opacity: 0,
                y: 30,
                filter: 'blur(10px)',
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
              }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="bg-linear-to-br from-sidebar-primary to-white bg-clip-text text-8xl font-medium text-transparent [text-shadow:0_0_80px_rgba(129,140,248,0.5),0_0_160px_rgba(99,102,241,0.3)]"
            >
              EXØS
            </motion.h1>

            <p className="text-3xl font-semibold leading-tight">{t('title')}</p>

            <p className="max-w-xl text-[16px] leading-8 text-chart-4">
              {t('description')}
            </p>

            <div className="mt-2 flex items-center gap-5">
              <Link href="#" target="_blank">
                <DownloadButton />
              </Link>

              <Link href="https://github.com/phexuss/exos" target="_blank">
                <GithubButton />
              </Link>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 w-52 rounded-4xl border border-white/10 bg-white/5 backdrop-blur-sm" />
          <div className="h-64 w-52 rounded-4xl border border-white/10 bg-white/5 backdrop-blur-sm" />
          <div className="h-64 w-52 rounded-4xl border border-white/10 bg-white/5 backdrop-blur-sm" />
        </div>
      </div>
    </section>
  );
}
