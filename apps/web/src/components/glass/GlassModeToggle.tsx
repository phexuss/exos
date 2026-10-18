'use client';

import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useGlassMode } from '@/components/providers/GlassModeProvider';
import { cn } from '@/lib/utils';

export function GlassModeToggle() {
  const t = useTranslations('Header');
  const { glassMode, toggleGlassMode } = useGlassMode();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={glassMode}
      aria-label={t('glassMode')}
      title={t('glassMode')}
      onClick={toggleGlassMode}
      className="group inline-flex h-9 cursor-pointer items-center gap-2 rounded-full px-2 text-muted-foreground transition-colors hover:text-white focus-visible:outline-2"
    >
      <Sparkles
        size={16}
        className={cn(
          'transition-all duration-300',
          glassMode ? 'text-primary opacity-100' : 'opacity-70',
        )}
      />
      <span
        className={cn(
          'relative h-5 w-9 rounded-full border transition-colors duration-300',
          glassMode
            ? 'border-white/25 bg-primary/60'
            : 'border-white/15 bg-white/5',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 left-0.5 size-3.5 -translate-y-1/2 rounded-full bg-white shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            glassMode && 'translate-x-4',
          )}
        />
      </span>
    </button>
  );
}
