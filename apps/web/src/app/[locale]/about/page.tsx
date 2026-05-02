import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;

  setRequestLocale(locale);

  const t = await getTranslations('AboutPage');

  return (
    <div>
      <Link href="/">{t('back')}</Link>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
