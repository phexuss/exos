import { useEffect, useRef } from 'react';

/**
 * Frames per second and the slowest frame over the last second, for checking
 * that the window really runs at the display's rate (144, 165 Hz). Writes the
 * text straight into the DOM so measuring doesn't cause React renders.
 */
export function FpsMeter() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let worst = 0;
    let last = performance.now();
    let windowStart = last;
    const tick = (now: number) => {
      frames += 1;
      worst = Math.max(worst, now - last);
      last = now;
      if (now - windowStart >= 1000) {
        const fps = Math.round((frames * 1000) / (now - windowStart));
        if (ref.current) ref.current.textContent = `${fps} к/с · худший кадр ${worst.toFixed(1)} мс`;
        frames = 0;
        worst = 0;
        windowStart = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <span ref={ref} className="kbd fps tabular" />;
}
