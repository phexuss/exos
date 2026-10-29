import { create } from 'zustand';

export type Route =
  | { name: 'home' }
  | { name: 'search'; q?: string }
  | { name: 'library' }
  | { name: 'downloads' }
  | { name: 'settings' }
  | { name: 'album'; id: string }
  | { name: 'artist'; id: string }
  | { name: 'playlist'; id: string }
  | { name: 'import'; url?: string };

type NavState = {
  stack: Route[];
  index: number;
  route: Route;
  /** 1 going forward, -1 going back; pages slide in from that side. */
  dir: 1 | -1;
  go: (route: Route) => void;
  back: () => void;
  forward: () => void;
  canBack: boolean;
  canForward: boolean;
};

const sameRoute = (a: Route, b: Route) => JSON.stringify(a) === JSON.stringify(b);

export const useNav = create<NavState>((set, get) => ({
  stack: [{ name: 'home' }],
  index: 0,
  route: { name: 'home' },
  dir: 1,
  canBack: false,
  canForward: false,
  go: (route) => {
    const { stack, index } = get();
    if (sameRoute(stack[index], route)) return;
    const next = [...stack.slice(0, index + 1), route].slice(-50);
    const i = next.length - 1;
    set({ stack: next, index: i, route, dir: 1, canBack: i > 0, canForward: false });
  },
  back: () => {
    const { stack, index } = get();
    if (index === 0) return;
    set({ index: index - 1, route: stack[index - 1], dir: -1, canBack: index - 1 > 0, canForward: true });
  },
  forward: () => {
    const { stack, index } = get();
    if (index >= stack.length - 1) return;
    set({
      index: index + 1,
      route: stack[index + 1],
      dir: 1,
      canBack: true,
      canForward: index + 1 < stack.length - 1,
    });
  },
}));
