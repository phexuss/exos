'use client';

import { useTranslations } from 'next-intl';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Link } from '@/i18n/navigation';

export function Header() {
  const t = useTranslations('Header');

  return (
    <header>
      <nav
        aria-label="Main navigation"
        className="flex items-center justify-between max-w-6xl mx-auto py-2.75 "
      >
        <Link
          href="#"
          className="bg-linear-to-br from-sidebar-primary to-white text-transparent bg-clip-text  text-2xl font-medium"
        >
          EXØS
        </Link>
        <NavigationMenu>
          <NavigationMenuList className="gap-6 flex">
            <NavigationMenuItem></NavigationMenuItem>

            <NavigationMenuItem>
              <Link
                href="#features"
                className="text-secondary-foreground hover:text-foreground duration-300"
              >
                {t('features')}
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                href="#sources"
                className="text-secondary-foreground hover:text-foreground duration-300"
              >
                {t('sources')}
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                href="#faq"
                className="text-secondary-foreground hover:text-foreground duration-300"
              >
                {t('faq')}
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                href="#download"
                className="text-secondary-foreground hover:text-foreground transition duration-300"
              >
                {t('download')}
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
    </header>
  );
}
