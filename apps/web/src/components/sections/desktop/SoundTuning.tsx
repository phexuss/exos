'use client';

import { Blend, SlidersVertical, Volume2 } from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import {
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from '@/components/motion/scrollReveal';

const TOOLS = [
  { key: 'eq', icon: SlidersVertical },
  { key: 'normalize', icon: Volume2 },
  { key: 'crossfade', icon: Blend },
] as const;

/** The app's 10 bands and its presets, the same numbers as desktop/src/lib/fx.ts. */
const BANDS = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];
const RANGE_DB = 12;
const PRESETS = {
  bass: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  vocal: [-2, -2, -1, 0, 2, 4, 4, 3, 1, 0],
  electronic: [5, 4, 1, 0, -2, 0, 1, 3, 4, 5],
  acoustic: [3, 3, 2, 1, 1, 1, 2, 3, 2, 1],
} as const;
type Preset = keyof typeof PRESETS;
const ORDER = Object.keys(PRESETS) as Preset[];
/** How long each preset stays before the demo moves to the next. */
const HOLD_MS = 2200;

/** The equalizer page of the app's sound popover, drawn in markup: it walks through the presets. */
function EqDemo() {
  const t = useTranslations('Desktop.soundTuning');
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { amount: 0.4 });
  const still = useReducedMotion();
  const [at, setAt] = useState(0);

  useEffect(() => {
    if (!inView || still) return;
    const id = setInterval(() => setAt((i) => (i + 1) % ORDER.length), HOLD_MS);
    return () => clearInterval(id);
  }, [inView, still]);

  const preset = ORDER[at];
  const gains = PRESETS[preset];

  return (
    <div
      ref={root}
      role="img"
      aria-label={t('demoLabel')}
      className="pane flex flex-col gap-5 rounded-pane p-5 sm:p-6"
    >
      <div className="flex flex-wrap gap-2" aria-hidden>
        {ORDER.map((p) => (
          <span
            key={p}
            className={[
              'rounded-full px-3 py-1.5 font-medium text-sm transition-colors duration-300',
              p === preset
                ? 'bg-primary text-on-accent'
                : 'bg-fill-2 text-text-2',
            ].join(' ')}
          >
            {t(`presets.${p}`)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-10 gap-1.5 sm:gap-2" aria-hidden>
        {BANDS.map((band, i) => {
          const db = gains[i];
          // Half the column is above 0 dB, half below; the bar grows from the middle.
          const size = (Math.abs(db) / RANGE_DB) * 50;
          return (
            <div key={band} className="flex flex-col items-center gap-2">
              <span className="font-mono text-[11px] text-text-3 tabular-nums">
                {db > 0 ? `+${db}` : db}
              </span>
              <div className="relative flex h-40 w-full justify-center">
                <span className="absolute inset-y-0 w-1.5 rounded-full bg-fill-2" />
                <span
                  className="absolute w-1.5 rounded-full bg-primary transition-all duration-500 ease-out"
                  style={
                    db >= 0
                      ? { bottom: '50%', height: `${size}%` }
                      : { top: '50%', height: `${size}%` }
                  }
                />
                <span
                  className="absolute size-3.5 -translate-y-1/2 rounded-full bg-foreground shadow transition-all duration-500 ease-out"
                  style={{ top: `${50 - (db / RANGE_DB) * 50}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-text-3">{band}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Equalizer, loudness normalization and crossfade: the demo first, then what each does. */
export function SoundTuning() {
  const t = useTranslations('Desktop.soundTuning');
  return (
    <motion.section
      className="mx-auto grid max-w-275 items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14"
      variants={revealContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <motion.div variants={revealItemVariants} className="lg:order-2">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="font-bold text-3xl sm:text-4xl">{t('title')}</h2>
            <p className="leading-7 text-text-2">{t('lead')}</p>
          </div>
          <ul className="flex flex-col gap-6">
            {TOOLS.map(({ key, icon: Icon }) => (
              <li key={key} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-fill-2 text-primary">
                  <Icon size={18} />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium text-lg">
                    {t(`tools.${key}.title`)}
                  </h3>
                  <p className="text-sm leading-6 text-text-2">
                    {t(`tools.${key}.text`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
      <motion.div variants={revealItemVariants} className="lg:order-1">
        <EqDemo />
      </motion.div>
    </motion.section>
  );
}
