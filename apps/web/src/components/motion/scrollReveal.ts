const revealEase = [0.16, 1, 0.3, 1] as const;

export const revealViewport = {
  once: true,
  amount: 0.2,
} as const;

export const revealContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.06,
    },
  },
};

export const revealItemVariants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.7,
      ease: revealEase,
    },
  },
};
