'use client';

import * as motion from 'motion/react-client';
import Image from 'next/image';

export const HeroScreens = () => {
  return (
    <div className="relative flex justify-center items-center w-full lg:w-125 shrink-0 h-112.5 sm:h-125h-[600px] perspective-distant">
      <div className="relative flex justify-center items-center w-full h-full scale-[0.70] sm:scale-[0.80] lg:scale-100 origin-center transition-transform duration-300">
        <div className="absolute z-0 top-1/2 left-1/2 w-45 h-60 -translate-x-17.5 -translate-y-15 bg-[#818cf8]/25 blur-[50px] rounded-full pointer-events-none sm:w-50 sm:h-70 sm:-translate-x-25 sm:-translate-y-18.75 sm:blur-[60px] lg:w-50 lg:h-70 lg:-translate-x-25 lg:-translate-y-18.75 lg:blur-[60px] xl:w-55 xl:h-75 xl:-translate-x-30 xl:-translate-y-20 xl:blur-[70px]" />

        <div className="absolute z-0 top-1/2 left-1/2 w-45 h-60 translate-x-10 translate-y-15 bg-[#818cf8]/25 blur-[50px] rounded-full pointer-events-none sm:w-50 sm:h-70 sm:translate-x-15 sm:translate-y-17.5 sm:blur-[60px] lg:w-50 lg:h-70 lg:translate-x-15 lg:translate-y-17.5 lg:blur-[60px] xl:w-55 xl:h-75 xl:translate-x-15 xl:translate-y-20 xl:blur-[70px]" />

        <motion.div
          initial={{ opacity: 0, x: -100, rotateY: 20, rotateX: 5 }}
          whileInView={{
            opacity: 1,
            x: -80,
            y: -30,
            rotateY: 25,
            rotateX: 10,
            rotateZ: -5,
            scale: 0.95,
          }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="absolute z-10 w-60 rounded-[2rem] border-4 border-neutral-800 shadow-[0_0px_50px_-15px_rgba(129,140,248,0.15)] overflow-hidden bg-black"
        >
          <Image
            src="/player.jpg"
            alt="Library"
            width={800}
            height={1600}
            quality={100}
            className="w-full h-auto"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 100, rotateY: -10, scale: 0.9 }}
          whileInView={{
            opacity: 1,
            x: 80,
            y: 30,
            rotateY: -20,
            rotateX: 10,
            rotateZ: 4,
            scale: 1,
          }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="absolute z-20 w-63.75 rounded-[2rem] border-4 border-neutral-900 shadow-[0_20px_60px_-15px_rgba(129,140,248,0.2)] overflow-hidden bg-black"
        >
          <Image
            src="/image.png"
            alt="Player"
            width={800}
            height={1600}
            quality={100}
            className="w-full h-auto"
          />
        </motion.div>
      </div>
    </div>
  );
};
