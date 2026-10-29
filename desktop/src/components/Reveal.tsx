import { useEffect } from 'react';
import { reducedMotion } from '@/lib/motion';
import { Aurora, Wordmark } from './Brand';

/**
 * The app opening after a sign-in: the sign-in backdrop stays over the shell
 * and a circle opens out of the wordmark, while the wordmark grows, its Ø
 * turns, and the shell's parts slide in underneath (`.shell.is-entering`).
 */
export function Reveal({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    if (reducedMotion()) {
      onDone();
      return;
    }
    // In case the webview drops animationend (a hidden window, for one).
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="reveal" aria-hidden="true">
      <div
        className="reveal__veil"
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) onDone();
        }}
      >
        <Aurora />
      </div>
      <div className="reveal__mark login__mark">
        <Wordmark />
      </div>
    </div>
  );
}
