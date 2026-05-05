'use client';

import { Check, Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export default function LanguageSwitcher() {
  const currentLang = useLocale().toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2 px-2 hover:bg-transparent text-muted-foreground hover:text-white transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <Globe size={16} className="opacity-70" />
          <span className="text-sm font-medium">{currentLang}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-36 p-1.5 rounded-2xl bg-[#121212]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95"
      >
        {[
          { code: 'ru', label: 'Русский' },
          { code: 'en', label: 'English' },
        ].map((lang) => {
          const isActive = currentLang === lang.code.toUpperCase();

          return (
            <DropdownMenuItem
              key={lang.code}
              asChild
              className="p-0 mb-0.5 last:mb-0 cursor-pointer rounded-xl focus:bg-white/5 transition-colors"
            >
              <Link
                href="/"
                locale={lang.code}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-white',
                )}
              >
                <span className="text-sm tracking-wide">{lang.label}</span>

                {isActive && (
                  <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />
                )}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
