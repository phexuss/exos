'use client';

import * as motion from 'motion/react-client';
import {
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from '@/components/motion/scrollReveal';
import FaqAccordion from './FaqAccordion';

export default function Faq() {
  return (
    <motion.section
      id="faq"
      className="flex flex-col items-start py-16 sm:py-24 max-w-275 mx-auto px-4 sm:px-6"
      variants={revealContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      <motion.h2
        className="mb-6 font-bold text-3xl sm:text-4xl"
        variants={revealItemVariants}
      >
        FAQ
      </motion.h2>
      <FaqAccordion />
    </motion.section>
  );
}
