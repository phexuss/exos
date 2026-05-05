import { Download, Music, Search } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface FeatureCardProps {
  topic: 'search' | 'download' | 'lyrics';
}

const iconMap = {
  search: Search,
  download: Download,
  lyrics: Music,
};

export default async function FeatureCard({ topic }: FeatureCardProps) {
  const t = await getTranslations('Features');
  const Icon = iconMap[topic];

  return (
    <article className="group relative flex h-full flex-col gap-3 sm:gap-4 p-5 sm:p-6 lg:p-8 bg-card border border-[rgba(255,255,255,0.08)] rounded-2xl transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
      <div className="w-fit p-2.5 sm:p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
        <Icon size={24} />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
          {t(`${topic}.title`)}
        </h3>
        <p className="text-muted-foreground leading-relaxed text-sm">
          {t(`${topic}.description`)}
        </p>
      </div>
    </article>
  );
}
