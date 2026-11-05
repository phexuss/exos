import { setRequestLocale } from 'next-intl/server';
import { PlatformProvider } from '@/components/providers/PlatformProvider';
import Footer from '@/components/sections/Footer';
import { Header } from '@/components/sections/Header';
import { Landing } from '@/components/sections/Landing';
import { getReleases } from '@/lib/releases';

type Props = {
  params: Promise<{ locale: string }>;
};

/** Rebuilt at most hourly, so a new desktop or Android release shows up without a deploy. */
export const revalidate = 3600;

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const releases = await getReleases();

  return (
    <PlatformProvider>
      <Header />
      <main>
        <Landing releases={releases} />
      </main>
      <div className="border-t border-rim bg-glass-thick backdrop-blur-xl">
        <Footer />
      </div>
    </PlatformProvider>
  );
}
