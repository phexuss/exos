import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export default function PrivacyPage() {
  const t = useTranslations('Legal.Privacy');
  const privacySections = ['collection', 'storage', 'security'] as const;

  return (
    <div className="min-h-screen bg-background py-20 px-4 flex justify-center selection:bg-primary/30">
      <article className="w-full max-w-3xl bg-card border border-border rounded-4xl p-8 md:p-16 shadow-2xl relative overflow-hidden">
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 blur-3xl rounded-full pointer-events-none" />

        <header className="flex flex-col items-center text-center mb-16">
          <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mb-6 text-primary shadow-inner shadow-primary/20">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-3">
            {t('title')}
          </h1>
          <p className="text-muted-foreground text-sm font-light opacity-60 italic">
            Your data remains yours. Always.
          </p>
        </header>

        <div className="space-y-12">
          {privacySections.map((sectionKey) => (
            <section key={sectionKey} className="space-y-5">
              <h2 className="text-xl font-semibold text-white tracking-tight">
                {t(`sections.${sectionKey}.title`)}
              </h2>
              <p className="text-white/90 leading-relaxed text-base font-normal">
                {t(`sections.${sectionKey}.description`)}
              </p>
              <div className="h-px w-full bg-linear-to-r from-white/10 via-white/5 to-transparent mt-8" />
            </section>
          ))}
        </div>

        <footer className="mt-20 pt-10 flex flex-col items-center gap-8 text-center">
          <p className="text-muted-foreground text-sm max-w-xs leading-relaxed font-light">
            We value your trust and ensure your information is encrypted and
            safe.
          </p>
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
