/**
 * Spring presets for `motion`. Springs keep their velocity when interrupted,
 * so a pill that changes target halfway glides on instead of restarting, and
 * they settle by physics rather than after a fixed duration. Everything they
 * drive is transform or opacity, so the compositor runs it.
 */
import type { Transition } from 'motion/react';

/** UI that follows a click: selection pills, tabs, toggles. */
export const snappy: Transition = { type: 'spring', stiffness: 560, damping: 40, mass: 0.8 };
/** Things that arrive: toasts, list items, panels. */
export const soft: Transition = { type: 'spring', stiffness: 320, damping: 30, mass: 0.9 };
/** Lists rearranging themselves. */
export const glide: Transition = { type: 'spring', stiffness: 420, damping: 42 };
