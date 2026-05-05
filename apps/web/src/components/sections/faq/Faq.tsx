'use client';

import FaqAccordion from './FaqAccordion';

export default function Faq() {
  return (
    <section className="flex flex-col items-start py-12 sm:py-14 lg:py-16 max-w-275 mx-auto px-4 sm:px-6">
      <h2 className="font-semibold mb-2 text-center text-primary text-xl">
        FAQ
      </h2>
      <FaqAccordion />
    </section>
  );
}
