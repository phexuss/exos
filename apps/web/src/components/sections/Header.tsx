'use client';
import * as motion from 'motion/react-client';
import { useTranslations } from 'next-intl';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from '../shared/LanguageSwitcher';

export function Header() {
  const t = useTranslations('Header');

  return (
    <motion.header
      className="sticky top-0 z-50 backdrop-blur-md"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.5,
        delay: 1.2,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <nav
        aria-label="Main navigation"
        className="flex items-center justify-between max-w-275 mx-auto px-4 sm:px-6 py-3"
      >
        <Link
          href="#"
          className="inline-flex bg-linear-to-br from-sidebar-primary to-white text-transparent bg-clip-text text-lg sm:text-xl md:text-2xl font-medium"
        >
          EXØS
        </Link>
        <NavigationMenu className="w-auto">
          <NavigationMenuList className="flex items-center justify-end gap-x-4 text-sm sm:gap-x-6 sm:text-base">
            <NavigationMenuItem className="hidden sm:block">
              <Link
                href="#features"
                className="text-secondary-foreground hover:text-foreground duration-300"
              >
                {t('features')}
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem className="hidden sm:block">
              <Link
                href="#sources"
                className="text-secondary-foreground hover:text-foreground duration-300"
              >
                {t('sources')}
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem className="hidden sm:block">
              <Link
                href="#faq"
                className="text-secondary-foreground hover:text-foreground duration-300"
              >
                {t('faq')}
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem className="hidden sm:block">
              <Link
                href="#download"
                className="text-secondary-foreground hover:text-foreground transition duration-300"
              >
                {t('download')}
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <LanguageSwitcher />
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
    </motion.header>
  );
}
