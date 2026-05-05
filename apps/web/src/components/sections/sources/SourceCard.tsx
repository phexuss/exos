'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface SourceCardProps {
  source: 'deezer' | 'soundcloud';
}

export default function SourceCard({ source }: SourceCardProps) {
  const t = useTranslations('Sources');

  const advantages = Object.values(
    t.raw(`${source}.advantages`) as Record<string, string>,
  );

  const disadvantages = Object.values(
    t.raw(`${source}.disadvantages`) as Record<string, string>,
  );

  const isDeezer = source === 'deezer';

  return (
    <article
      className={`
        group relative h-full overflow-hidden flex flex-col gap-4 rounded-2xl border border-white/8 bg-card px-5 py-5 sm:px-7 sm:py-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${source === 'deezer' ? 'hover:shadow-yellow-400/20' : 'hover:shadow-emerald-300/20'}`}
    >
      <div
        className={`absolute top-0 left-2 right-2 h-px ${
          isDeezer ? 'bg-yellow-400/90' : 'bg-emerald-300/90'
        }`}
      />
      <div
        className={`absolute top-0 left-2 right-2 h-px ${
          isDeezer ? 'bg-yellow-400/90' : 'bg-emerald-300/90'
        } blur-[3px]`}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`inline-flex rounded-full border px-4 py-1 text-sm backdrop-blur-xl ${
              isDeezer
                ? 'border-yellow-400/10 bg-yellow-400/20 text-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.12)]'
                : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300 shadow-[0_0_20px_rgba(74,222,128,0.12)]'
            }`}
          >
            {t(`${source}.speed`)}
          </div>
        </div>

        <div className="flex flex-row gap-2 items-center">
          <h3 className="text-lg sm:text-xl font-semibold">
            {t(`${source}.title`)}
          </h3>
          <Image
            src={`/${source}.svg`}
            alt={`${source} logo`}
            width={26}
            height={26}
          />
        </div>

        <ul className="mt-4 space-y-2 leading-relaxed">
          {advantages.map((advantage) => (
            <li key={advantage}>+ {advantage}</li>
          ))}

          {disadvantages.map((disadvantage) => (
            <li key={disadvantage} className="text-muted-foreground">
              - {disadvantage}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
