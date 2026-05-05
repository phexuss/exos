import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default function TermsPage() {
  const t = useTranslations('Legal.Terms');

  const sectionKeys = [
    'provisions',
    'description',
    'thirdParty',
    'copyright',
    'liability',
  ] as const;

  return (
    <div className="min-h-screen bg-background py-20 px-4 flex justify-center selection:bg-primary/30">
      <article className="w-full max-w-3xl bg-card border border-border rounded-4xl p-8 md:p-16 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 blur-3xl rounded-full pointer-events-none" />

        <header className="flex flex-col items-center text-center mb-16">
          <div className="text-xl font-bold tracking-[0.2em] text-white uppercase italic mb-6">
            EXØS
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest opacity-70">
            {t('lastUpdated')}
          </p>
        </header>

        <div className="space-y-16">
          {sectionKeys.map((sectionKey) => (
            <section key={sectionKey} className="group">
              <h2 className="text-xl font-semibold text-white flex items-center gap-4 mb-6">
                <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 w-8 h-8 flex items-center justify-center rounded-lg">
                  0{sectionKeys.indexOf(sectionKey) + 1}
                </span>
                {t(`sections.${sectionKey}.title`)}
              </h2>
              <ul className="space-y-5">
                {(t.raw(`sections.${sectionKey}.items`) as string[]).map(
                  (item) => (
                    <li
                      key={item.slice(0, 30)}
                      className="text-white/90 leading-relaxed text-base pl-6 border-l-2 border-white/10 group-hover:border-primary/40 transition-colors"
                    >
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </section>
          ))}
        </div>

        <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col items-center gap-10">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-sm font-light">
              Have questions regarding our terms?
            </p>
            <a
              href="mailto:phexuss@icloud.com"
              className="text-primary hover:text-primary/80 transition-colors font-medium"
            >
              phexuss@icloud.com
            </a>
          </div>

          <Button
            variant="ghost"
            asChild
            className="rounded-full text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
          >
            <Link href="/" className="flex items-center gap-2">
              <ChevronLeft size={16} />
              Return Home
            </Link>
          </Button>
        </footer>
      </article>
    </div>
  );
}
