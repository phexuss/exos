'use client';
import { useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FaqAccordion() {
  const t = useTranslations('Faq');

  const faqKeys = [
    'time',
    'music-store',
    'legal',
    'registration',
    'privacy',
  ] as const;

  return (
    <div className="w-full">
      <Accordion
        type="single"
        collapsible
        className="w-full space-y-4 border-none"
      >
        {faqKeys.map((key) => (
          <AccordionItem
            key={key}
            value={key}
            className="group relative border border-[rgba(255,255,255,0.08)] rounded-2xl bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 overflow-hidden"
          >
            <AccordionTrigger className="px-5 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 text-base sm:text-lg md:text-xl font-medium tracking-tight text-foreground hover:no-underline transition-colors group-data-[state=open]:text-primary">
              <span className="text-left">{t(`${key}.question`)}</span>
            </AccordionTrigger>

            <AccordionContent className="px-5 sm:px-6 lg:px-8 pb-5 sm:pb-6">
              <div className="text-muted-foreground leading-relaxed text-sm border-t border-[rgba(255,255,255,0.08)] pt-4">
                {t(`${key}.answer`)}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
