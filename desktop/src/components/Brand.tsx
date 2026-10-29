import { useState } from 'react';

/** EXØS with the Ø as its own glyph, so it can turn like a record. */
export function Wordmark() {
  return (
    <>
      EX<span className="wm__o">Ø</span>S
    </>
  );
}

/** Seconds per loop of the backdrop's drift; kept in step with `--drift` in app.css. */
const DRIFT_MS = 24_000;

/**
 * Slow colour fields behind the sign-in screen and the opening reveal. Both
 * start at the same point of the loop (read off the clock), so swapping one
 * for the other never makes the colours jump.
 */
export function Aurora() {
  const [phase] = useState(() => `-${Math.round(performance.now() % DRIFT_MS)}ms`);
  return (
    <div className="aurora" aria-hidden="true" style={{ '--phase': phase } as React.CSSProperties}>
      <i />
      <i />
      <i />
    </div>
  );
}
