'use client';

import { Download as DownloadIcon, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from '@/components/motion/scrollReveal';
import { usePlatform } from '@/components/providers/PlatformProvider';
import { primaryButton } from '@/components/shared/buttons';
import {
  APK_URL,
  type DesktopFile,
  type DesktopRelease,
  RELEASES_URL,
} from '@/lib/releases';
import { useOs } from '@/lib/useOs';
import { cn } from '@/lib/utils';

const FILES: { key: DesktopFile; os: 'win' | 'mac' | 'linux' }[] = [
  { key: 'win', os: 'win' },
  { key: 'mac', os: 'mac' },
  { key: 'appimage', os: 'linux' },
  { key: 'targz', os: 'linux' },
];

const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);

export function Download({ release }: { release: DesktopRelease | null }) {
  const { platform } = usePlatform();
  return platform === 'desktop' ? (
    <DesktopDownload release={release} />
  ) : (
    <AndroidDownload />
  );
}

function DesktopDownload({ release }: { release: DesktopRelease | null }) {
  const t = useTranslations('Desktop');
  const os = useOs();
  return (
    <motion.section
      id="download"
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
        <h2 className="font-bold text-3xl sm:text-4xl">
          {t('download.title')}
        </h2>
        <p className="leading-7 text-text-2">
          {release && `${t('download.lead', { version: release.version })} `}
          {t('download.unsigned')}
        </p>
      </motion.div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FILES.map(({ key, os: system }) => {
          const asset = release?.assets[key];
          const yours = os === system && key !== 'targz';
          return (
            <motion.a
              key={key}
              variants={revealItemVariants}
              href={asset?.url ?? RELEASES_URL}
              target={asset ? undefined : '_blank'}
              rel={asset ? undefined : 'noreferrer'}
              className={cn(
                'pane group flex min-h-40 flex-col justify-between gap-6 rounded-tile p-5 transition-transform duration-300 ease-spring hover:-translate-y-1',
                yours &&
                  'shadow-[inset_0_0_0_1px_var(--primary),0_20px_60px_-20px_var(--primary)]',
              )}
            >
              <div className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium text-xl">
                    {t(`os.${system}`)}
                  </span>
                  {yours && (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 font-medium text-xs text-on-accent">
                      {t('download.yours')}
                    </span>
                  )}
                </span>
                <span className="text-sm leading-6 text-text-2">
                  {t(`download.${key}`)}
                </span>
              </div>
              <span className="flex items-center justify-between text-sm text-text-3">
                <span>
                  {asset
                    ? t('download.size', { size: mb(asset.bytes) })
                    : 'GitHub'}
                </span>
                <DownloadIcon
                  size={18}
                  className="text-text-2 transition-colors group-hover:text-primary"
                />
              </span>
            </motion.a>
          );
        })}
      </div>
      <motion.a
        variants={revealItemVariants}
        href={RELEASES_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-text-2 transition-colors hover:text-white"
      >
        {t('download.all')}
        <ExternalLink size={14} />
      </motion.a>
    </motion.section>
  );
}

function AndroidDownload() {
  const t = useTranslations('Android.download');
  return (
    <motion.section
      id="download"
      className="mx-auto flex max-w-275 flex-col gap-6 px-4 py-16 sm:px-6 sm:py-24"
      variants={revealContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <motion.div
        variants={revealItemVariants}
        className="pane flex flex-col items-start gap-5 rounded-pane p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div className="flex max-w-[56ch] flex-col gap-2">
          <h2 className="font-bold text-3xl">{t('title')}</h2>
          <p className="leading-7 text-text-2">{t('lead')}</p>
        </div>
        <a href={APK_URL} className={primaryButton}>
          <DownloadIcon size={18} />
          {t('button')}
        </a>
      </motion.div>
    </motion.section>
  );
}
