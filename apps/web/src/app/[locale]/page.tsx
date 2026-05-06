import { setRequestLocale } from 'next-intl/server';
import Footer from '@/components/sections/Footer';
import Faq from '@/components/sections/faq/Faq';
import Features from '@/components/sections/features/Features';
import { Header } from '@/components/sections/Header';
import Hero from '@/components/sections/hero/Hero';
import Sources from '@/components/sections/sources/Sources';
import { CustomSeparator } from '@/components/shared/CustomSeparator';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  setRequestLocale(locale);

  return (
    <div>
      <Header />
      <main>
        <Hero />
        <CustomSeparator />
        <Features />
        <CustomSeparator />
        <Sources />
        <CustomSeparator />
        <Faq />
        <footer className="border-t">
          <Footer />
        </footer>
      </main>
    </div>
  );
}
