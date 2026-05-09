import * as motion from 'motion/react-client';
import { useTranslations } from 'next-intl';
import {
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from '@/components/motion/scrollReveal';
import FeatureCard from './FeatureCard';

export default function Features() {
  const t = useTranslations('Features');

  return (
    <motion.section
      id="features"
      className="max-w-275 mx-auto py-12 sm:py-14 lg:py-16 flex flex-col gap-5 sm:gap-7 px-4 sm:px-6"
      variants={revealContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <motion.div variants={revealItemVariants}>
        <h2 className="text-xl font-semibold text-primary">{t('title')}</h2>
        <p>{t('description')}</p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4.5 md:auto-rows-fr">
        <motion.div variants={revealItemVariants} className="h-full">
          <FeatureCard topic="search" />
        </motion.div>
        <motion.div variants={revealItemVariants} className="h-full">
          <FeatureCard topic="download" />
        </motion.div>
        <motion.div
          variants={revealItemVariants}
          className="h-full md:col-span-2 lg:col-span-1"
        >
          <FeatureCard topic="lyrics" />
        </motion.div>
      </div>
    </motion.section>
  );
}
