'use client';

import { useEffect, useState } from 'react';

export type Os = 'win' | 'mac' | 'linux';

/** The visitor's desktop system, or null on a phone or before the page has loaded. */
export function useOs(): Os | null {
  const [os, setOs] = useState<Os | null>(null);
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod/i.test(ua)) return;
    if (/Windows/i.test(ua)) setOs('win');
    else if (/Mac OS X|Macintosh/i.test(ua)) setOs('mac');
    else if (/Linux|X11/i.test(ua)) setOs('linux');
  }, []);
  return os;
}
