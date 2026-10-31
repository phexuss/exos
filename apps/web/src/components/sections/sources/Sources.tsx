import * as motion from 'motion/react-client';
import { useTranslations } from 'next-intl';
import {
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from '@/components/motion/scrollReveal';
import SourceCard from './SourceCard';

export default function Sources() {
  const t = useTranslations('Sources');
  return (
    <motion.section
      id="sources"
      className="grid grid-cols-1 lg:grid-cols-2 py-16 sm:py-24 max-w-275 mx-auto px-4 sm:px-6 gap-4 sm:gap-4.5 items-stretch"
      variants={revealContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <motion.div
        variants={revealItemVariants}
        className="flex max-w-[64ch] flex-col gap-3 lg:col-span-2"
      >
        <h2 className="font-bold text-3xl sm:text-4xl">{t('title')}</h2>
        <p className="leading-7 text-text-2">{t('description')}</p>
      </motion.div>
      <motion.div variants={revealItemVariants} className="h-full">
        <SourceCard source="deezer" />
      </motion.div>
      <motion.div variants={revealItemVariants} className="h-full">
        <SourceCard source="soundcloud" />
      </motion.div>
    </motion.section>
  );
}
