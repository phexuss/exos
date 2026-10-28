/**
 * Motion helpers. Everything here moves only transform and opacity, which the
 * compositor handles on every webview (WebKitGTK included) without repainting.
 */

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SPRING =
  'linear(0, 0.0068, 0.0268, 0.0594, 0.1033 4.9%, 0.2219, 0.3626 10.8%, 0.6747 17.5%, 0.8203, 0.9324 25.1%, 1.0123 30.4%, 1.0421, 1.0581 37.1%, 1.0619 39.6%, 1.0581, 1.0461 46.2%, 1.0187 53.7%, 0.9993 62.4%, 0.9942 68.3%, 0.9963 82.5%, 1)';
const SUPPORTS_LINEAR = typeof CSS !== 'undefined' && CSS.supports('animation-timing-function', 'linear(0, 1)');
/** An overshooting spring where the webview understands `linear()`, a firm ease-out elsewhere. */
export const springEasing = SUPPORTS_LINEAR ? SPRING : 'cubic-bezier(0.22, 1.2, 0.36, 1)';
export const outEasing = 'cubic-bezier(0.22, 1, 0.36, 1)';

/* ---------- the cover you clicked flies to the player ---------- */

let lastPress: { rect: DOMRect; node: HTMLElement; at: number } | null = null;

function coverNear(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const holder = target.closest('.tt__row, .card, .quick, .rank, .queue-item, .top-hit');
  return (holder?.querySelector('.cover') as HTMLElement | null) ?? null;
}

/** Spawns a copy of `from` at `rect` and moves it onto `to`, then removes it. */
export function fly(from: HTMLElement, rect: DOMRect, to: HTMLElement, duration = 640): Promise<void> {
  const target = to.getBoundingClientRect();
  if (reducedMotion() || !rect.width || !target.width) return Promise.resolve();
  const ghost = from.cloneNode(true) as HTMLElement;
  const radius = getComputedStyle(from).borderRadius;
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    zIndex: '200',
    pointerEvents: 'none',
    borderRadius: radius,
    transformOrigin: '0 0',
    boxShadow: '0 24px 60px var(--shadow-3)',
  });
  document.body.appendChild(ghost);
  const dx = target.left - rect.left;
  const dy = target.top - rect.top;
  const s = target.width / rect.width;
  // A little lift in the middle makes it read as thrown, not slid.
  const lift = Math.min(120, Math.hypot(dx, dy) * 0.18);
  const anim = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - lift}px) scale(${(1 + s) / 2})`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0.9 },
    ],
    { duration, easing: outEasing },
  );
  to.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], {
    duration: 420,
    delay: duration * 0.85,
    easing: springEasing,
  });
  return anim.finished.then(
    () => ghost.remove(),
    () => ghost.remove(),
  );
}

/** Called when a new track becomes current: fly from what was just clicked, if anything. */
export function flyPressedCoverTo(to: HTMLElement | null) {
  const press = lastPress;
  lastPress = null;
  if (!to || !press || Date.now() - press.at > 1500 || !press.node.isConnected) return;
  void fly(press.node, press.rect, to);
}

/* ---------- pointer-following light on surfaces ---------- */

function onPointerMove(e: PointerEvent) {
  const el = (e.target as Element | null)?.closest?.('.quick, .rank__row, .tt__row, .queue-item') as HTMLElement | null;
  if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
}

let installed = false;
export function installMotion() {
  if (installed) return;
  installed = true;
  document.addEventListener(
    'pointerdown',
    (e) => {
      const cover = coverNear(e.target);
      if (cover) lastPress = { rect: cover.getBoundingClientRect(), node: cover, at: Date.now() };
    },
    { capture: true, passive: true },
  );
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Enter') return;
      const cover = coverNear(document.activeElement);
      if (cover) lastPress = { rect: cover.getBoundingClientRect(), node: cover, at: Date.now() };
    },
    { capture: true },
  );
  document.addEventListener('pointermove', onPointerMove, { passive: true });
}
