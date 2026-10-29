/**
 * The window's only door out. Engine calls go straight to the utility process
 * over a MessagePort (never through the main process); window controls,
 * dialogs and the file manager go to the main process. Everything is async.
 */
import { contextBridge, ipcRenderer } from 'electron';

type Reply = { id: number; ok: boolean; value?: unknown; error?: string };
type Event = { event: string; payload: unknown };

let port: MessagePort | null = null;
let nextId = 1;
const waiting = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
const queued: { id: number; cmd: string; args?: unknown }[] = [];
const listeners = new Map<string, Set<(payload: unknown) => void>>();

// A fresh port arrives on every page load and whenever the engine restarts.
ipcRenderer.on('engine-port', (e) => {
  port?.close();
  // Calls sent to an engine that died will never be answered.
  for (const [id, w] of waiting) {
    if (!queued.some((q) => q.id === id)) {
      w.reject(
        new Error(
          document.documentElement.lang === 'en'
            ? 'the engine restarted, try again'
            : 'движок перезапустился, попробуй ещё раз',
        ),
      );
      waiting.delete(id);
    }
  }
  port = e.ports[0];
  port.onmessage = ({ data }: MessageEvent<Reply | Event>) => {
    if ('event' in data) {
      for (const fn of listeners.get(data.event) ?? []) fn(data.payload);
      return;
    }
    const w = waiting.get(data.id);
    if (!w) return;
    waiting.delete(data.id);
    if (data.ok) w.resolve(data.value);
    else w.reject(new Error(data.error));
  };
  for (const q of queued.splice(0)) port.postMessage(q);
});

function call(cmd: string, args?: unknown): Promise<unknown> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject });
    // The engine answers errors in the window's language.
    const msg = { id, cmd, args, lang: document.documentElement.lang };
    if (port) port.postMessage(msg);
    else queued.push(msg);
  });
}

function on(event: string, fn: (payload: unknown) => void): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(fn);
  return () => listeners.get(event)?.delete(fn);
}

contextBridge.exposeInMainWorld('exos', {
  platform: process.platform,
  call,
  on,
  shell: {
    reveal: (path: string) => ipcRenderer.invoke('shell:reveal', path),
    openFolder: (path: string) => ipcRenderer.invoke('shell:open-folder', path),
    pickFolder: () => ipcRenderer.invoke('dialog:pick-folder') as Promise<string | null>,
  },
  win: {
    minimize: () => ipcRenderer.invoke('win', 'minimize'),
    toggleMaximize: () => ipcRenderer.invoke('win', 'toggle-maximize'),
    close: () => ipcRenderer.invoke('win', 'close'),
    onMaximized: (fn: (maximized: boolean) => void) => {
      const h = (_: unknown, v: boolean) => fn(v);
      ipcRenderer.on('win:maximized', h);
      return () => ipcRenderer.off('win:maximized', h);
    },
  },
});
