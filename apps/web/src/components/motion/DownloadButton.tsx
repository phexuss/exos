import { Download } from 'lucide-react';
import * as motion from 'motion/react-client';
import { useTranslations } from 'next-intl';

export default function DownloadButton() {
  const t = useTranslations('Hero');
  return (
    <motion.button
      whileHover={{
        scale: 1.04,
        y: -2,
        boxShadow: '0 0 40px rgba(99,102,241,0.45)',
      }}
      whileTap={{
        scale: 0.97,
        y: 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 18,
      }}
      className="
        relative
        overflow-hidden
        rounded-2xl
        h-14
        px-6
        flex
        items-center
        gap-2
        font-medium
        cursor-pointer
        bg-linear-to-br
        from-accent
        to-sidebar-primary
        min-w-45
      "
    >
      <motion.div
        className="
          absolute
          inset-0
          opacity-0
          bg-white/10
        "
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />

      <Download size={18} />

      <span>{t('download')}</span>
    </motion.button>
  );
}
