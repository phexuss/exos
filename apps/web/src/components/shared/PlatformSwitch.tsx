'use client';

import { Monitor, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  type Platform,
  usePlatform,
} from '@/components/providers/PlatformProvider';
import { cn } from '@/lib/utils';

const OPTIONS: { value: Platform; icon: typeof Monitor }[] = [
  { value: 'desktop', icon: Monitor },
  { value: 'android', icon: Smartphone },
];

/** Segmented tabs, drawn like the ones in the desktop app. */
export function PlatformSwitch({ className }: { className?: string }) {
  const t = useTranslations('Platform');
  const { platform, setPlatform } = usePlatform();

  return (
    <div
      role="tablist"
      aria-label={t('label')}
      className={cn('inline-flex rounded-full bg-fill-2 p-1', className)}
    >
      {OPTIONS.map(({ value, icon: Icon }) => {
        const active = platform === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setPlatform(value)}
            className={cn(
              'relative inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors duration-200',
              active ? 'text-white' : 'text-text-3 hover:text-text-2',
            )}
          >
            {active && (
              <motion.span
                layoutId="platform-pill"
                className="absolute inset-0 rounded-full bg-fill-4"
                transition={{
                  type: 'spring',
                  stiffness: 560,
                  damping: 40,
                  mass: 0.8,
                }}
              />
            )}
            <Icon size={15} className="relative" />
            <span className="relative">{t(value)}</span>
          </button>
        );
      })}
    </div>
  );
}
