import { useTranslations } from 'next-intl';
import FeatureCard from './FeatureCard';

export default function Features() {
  const t = useTranslations('Features');

  return (
    <section
      id="features"
      className="max-w-275 mx-auto py-12 sm:py-14 lg:py-16 flex flex-col gap-5 sm:gap-7 px-4 sm:px-6"
    >
      <div>
        <h2 className="text-xl font-semibold text-primary">{t('title')}</h2>
        <p>{t('description')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4.5 md:auto-rows-fr">
        <FeatureCard topic="search" />
        <FeatureCard topic="download" />
        <div className="md:col-span-2 lg:col-span-1">
          <FeatureCard topic="lyrics" />
        </div>
      </div>
    </section>
  );
}
