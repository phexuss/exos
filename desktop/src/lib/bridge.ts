/** What the Electron preload exposes; undefined in a plain browser (prototype, vite dev). */
export type Bridge = {
  platform: string;
  call: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
  on: (event: string, fn: (payload: unknown) => void) => () => void;
  shell: {
    reveal: (path: string) => Promise<void>;
    openFolder: (path: string) => Promise<void>;
    pickFolder: () => Promise<string | null>;
  };
  win: {
    minimize: () => Promise<void>;
    toggleMaximize: () => Promise<void>;
    close: () => Promise<void>;
    onMaximized: (fn: (maximized: boolean) => void) => () => void;
  };
};

export const bridge = (globalThis as { exos?: Bridge }).exos;

export function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!bridge) return Promise.reject(new Error('no engine'));
  return bridge.call(cmd, args) as Promise<T>;
}

/* ---------- cover art through the engine's disk cache ---------- */

let mediaBase: string | null = null;
if (bridge) {
  void call<{ mediaBase: string }>('hello').then((h) => {
    mediaBase = h.mediaBase;
  });
}

/** A cover URL served from the local cache (fetched once, then from disk). */
export function imageUrl(src: string | undefined): string | undefined {
  if (!src || !mediaBase || !src.startsWith('https://')) return src;
  return `${mediaBase}/img?u=${encodeURIComponent(src)}`;
}
