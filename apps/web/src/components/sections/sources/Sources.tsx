import * as motion from 'motion/react-client';
import {
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from '@/components/motion/scrollReveal';
import SourceCard from './SourceCard';

export default function Sources() {
  return (
    <motion.section
      id="sources"
      className="grid grid-cols-1 lg:grid-cols-2 py-12 sm:py-14 lg:py-16 max-w-275 mx-auto px-4 sm:px-6 gap-4 sm:gap-4.5 items-stretch"
      variants={revealContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <motion.div variants={revealItemVariants} className="h-full">
        <SourceCard source="deezer" />
      </motion.div>
      <motion.div variants={revealItemVariants} className="h-full">
        <SourceCard source="soundcloud" />
      </motion.div>
    </motion.section>
  );
}
