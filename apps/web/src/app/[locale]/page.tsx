import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/sections/Header';
import Hero from '@/components/sections/Hero';
import { Link } from '@/i18n/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  setRequestLocale(locale);

  const t = await getTranslations('HomePage');

  return (
    <div>
      <div className="bg-black">
        <Header />
      </div>
      <main className="max-w-275 mx-auto">
        <Hero />
      </main>

      <Link href="/" locale="en">
        EN
      </Link>
      <Link href="/" locale="ru">
        RU nothing else
      </Link>
      <Link href="/about" className="font-sans">
        {t('about')}
      </Link>

      <h1>{t('title')}</h1>
    </div>
  );
}
