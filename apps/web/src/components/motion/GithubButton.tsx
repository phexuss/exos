import * as motion from 'motion/react-client';
import Image from 'next/image';

export default function GithubButton() {
  return (
    <motion.button
      whileHover={{
        scale: 1.04,
        y: -2,
        boxShadow: '0 0 25px rgba(255,255,255,0.45)',
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
        bg-white
        text-black
      "
    >
      <Image src="/github.svg" width={21} height={21} alt="GitHub Logo" />
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

      <span>GitHub</span>
    </motion.button>
  );
}
