import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const t = useTranslations('Footer');
  return (
    <footer>
      <nav className="max-w-275 mx-auto px-4 sm:px-6 pb-8 sm:pb-10 pt-6 sm:pt-7">
        <ul className="flex flex-col items-center gap-3 text-sm sm:flex-row sm:justify-between sm:items-center sm:text-base">
          <li className="bg-linear-to-br from-sidebar-primary to-white text-transparent bg-clip-text text-base sm:text-lg font-medium">
            EXØS
          </li>
          <li className="text-gray-500 text-center sm:text-left">
            © 2026 EXØS. {t('rights')}
          </li>
          <li className="flex flex-wrap justify-center gap-3 text-gray-500 sm:justify-end">
            <Link
              href="https://github.com/phexuss/exos"
              className="hover:text-foreground duration-300"
              target="_blank"
            >
              GitHub
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground duration-300"
            >
              Privacy
            </Link>
            <Link href="/tos" className="hover:text-foreground duration-300">
              Terms
            </Link>
          </li>
        </ul>
      </nav>
    </footer>
  );
}
