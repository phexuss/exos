'use client';

import { FileUp, Search, Timer } from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import {
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from '@/components/motion/scrollReveal';

const WAYS = [
  { key: 'paste', icon: FileUp },
  { key: 'find', icon: Search },
  { key: 'sync', icon: Timer },
] as const;

/** Sample time tags for the demo lines, in the [mm:ss.xx] form the app writes. */
const STAMPS = ['00:12.40', '00:16.85', '00:21.10', '00:29.75', '00:34.30'];
/** How long the demo waits before "pressing Space" on the next line. */
const TAP_MS = 1400;

/** The sync mode of the app's lyrics editor, drawn in markup: lines get stamped one by one. */
function SyncDemo() {
  const t = useTranslations('Desktop.lyrics');
  const lines = t.raw('demoLines') as string[];
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.4 });
  const still = useReducedMotion();
  const [stamped, setStamped] = useState(2);

  useEffect(() => {
    if (!inView || still) return;
    const id = setInterval(
      () => setStamped((n) => (n >= lines.length ? 0 : n + 1)),
      TAP_MS,
    );
    return () => clearInterval(id);
  }, [inView, still, lines.length]);

  return (
    <div
      ref={root}
      role="img"
      aria-label={t('demoLabel')}
      className="pane flex flex-col gap-4 rounded-pane p-5 sm:p-6"
    >
      <ol className="flex flex-col gap-1" aria-hidden>
        {lines.map((line, i) => {
          const set = i < stamped;
          const next = i === stamped;
          return (
            <li
              key={line}
              className={[
                'grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-3 rounded-lg px-3 py-2 transition-colors duration-300',
                next
                  ? 'bg-primary/15 text-foreground'
                  : set
                    ? 'text-text-2'
                    : 'text-text-3',
              ].join(' ')}
            >
              <span
                className={`font-mono text-xs tabular-nums ${next ? 'text-primary' : 'text-text-3'}`}
              >
                {set ? STAMPS[i] : '–'}
              </span>
              <span className="font-medium">{line}</span>
            </li>
          );
        })}
      </ol>
      <div className="flex justify-end" aria-hidden>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-bold text-on-accent text-sm">
          {t('demoButton')}
          <span className="rounded border border-current px-1.5 py-0.5 font-medium text-[11px] opacity-60">
            {t('demoKey')}
          </span>
        </span>
      </div>
    </div>
  );
}

/** What to do when the found lyrics are wrong or missing: three ways in, and the sync mode shown working. */
export function LyricsEditing() {
  const t = useTranslations('Desktop.lyrics');
  return (
    <motion.section
      className="mx-auto grid max-w-275 items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14"
      variants={revealContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <motion.div variants={revealItemVariants} className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="font-bold text-3xl sm:text-4xl">{t('title')}</h2>
          <p className="leading-7 text-text-2">{t('lead')}</p>
        </div>
        <ul className="flex flex-col gap-6">
          {WAYS.map(({ key, icon: Icon }) => (
            <li key={key} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-fill-2 text-primary">
                <Icon size={18} />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-medium text-lg">
                  {t(`ways.${key}.title`)}
                </h3>
                <p className="text-sm leading-6 text-text-2">
                  {t(`ways.${key}.text`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>
      <motion.div variants={revealItemVariants}>
        <SyncDemo />
      </motion.div>
    </motion.section>
  );
}
