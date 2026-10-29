/**
 * The main process stays thin: it opens the window, serves the UI files,
 * starts the engine (a utility process) and connects the two with a
 * MessagePort, and answers the few things only it can do (window controls,
 * dialogs, the file manager). Nothing here parses responses or touches audio.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  MessageChannelMain,
  net,
  protocol,
  shell,
  type UtilityProcess,
  utilityProcess,
} from 'electron';

const RENDERER = path.join(__dirname, '..', 'dist');
const DEV_URL = process.env.EXOS_DEV_URL;
const isMac = process.platform === 'darwin';

app.setName('EXØS');
app.setAppUserModelId('dev.phexuss.exos');

// The UI is served from app://, which Chromium treats like https: it gets
// fetch, a stable origin for localStorage, and (unlike file://) V8 keeps the
// compiled code of the UI's scripts on disk between launches.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, codeCache: true } },
]);

if (!app.requestSingleInstanceLock()) app.exit(0);

// Linux runs as a native Wayland client when the session is Wayland, which is
// what gives it the monitor's real refresh rate. EXOS_X11=1 forces XWayland
// for drivers that misbehave.
if (process.platform === 'linux' && process.env.EXOS_X11 === '1') app.commandLine.appendSwitch('ozone-platform', 'x11');

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https: http://127.0.0.1:*",
  "media-src 'self' blob: http://127.0.0.1:*",
  "connect-src 'self' http://127.0.0.1:*",
].join('; ');

function serveUi() {
  protocol.handle('app', async (req) => {
    const rel = decodeURIComponent(new URL(req.url).pathname);
    const file = path.normalize(path.join(RENDERER, rel === '/' ? 'index.html' : rel));
    if (!file.startsWith(RENDERER + path.sep)) return new Response(null, { status: 404 });
    const res = await net.fetch(pathToFileURL(file).toString());
    if (!file.endsWith('.html')) return res;
    const headers = new Headers(res.headers);
    headers.set('Content-Security-Policy', CSP);
    headers.set('Content-Type', 'text/html; charset=utf-8');
    return new Response(res.body, { status: res.status, headers });
  });
}

/* ---------- engine ---------- */

let engine: UtilityProcess | null = null;
let quitting = false;
let win: BrowserWindow | null = null;

function musicDir(): string {
  try {
    return app.getPath('music');
  } catch {
    return path.join(app.getPath('home'), 'Music');
  }
}

function startEngine() {
  engine = utilityProcess.fork(path.join(__dirname, 'boot.cjs'), [], {
    serviceName: 'EXØS engine',
    stdio: 'inherit',
    env: {
      ...process.env,
      EXOS_ENTRY: 'engine',
      EXOS_MUSIC_DIR: musicDir(),
      EXOS_VERSION: app.getVersion(),
    },
  });
  engine.on('exit', (code) => {
    engine = null;
    if (quitting) return;
    console.error(`engine exited (${code}); restarting`);
    setTimeout(() => {
      startEngine();
      connect();
    }, 500);
  });
}

/** Hands the window and the engine the two ends of a fresh channel. */
function connect() {
  if (!engine || !win || win.isDestroyed()) return;
  const { port1, port2 } = new MessageChannelMain();
  engine.postMessage({ type: 'port' }, [port1]);
  win.webContents.postMessage('engine-port', null, [port2]);
}

/* ---------- window ---------- */

type Bounds = { x?: number; y?: number; width: number; height: number; maximized?: boolean };
const boundsFile = () => path.join(app.getPath('userData'), 'window.json');

function savedBounds(): Bounds {
  try {
    return JSON.parse(fs.readFileSync(boundsFile(), 'utf8')) as Bounds;
  } catch {
    return { width: 1360, height: 860 };
  }
}

function createWindow() {
  const b = savedBounds();
  win = new BrowserWindow({
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'EXØS',
    backgroundColor: '#121212',
    frame: isMac,
    titleBarStyle: isMac ? 'hiddenInset' : undefined,
    trafficLightPosition: isMac ? { x: 16, y: 20 } : undefined,
    icon: process.platform === 'linux' ? path.join(__dirname, '..', 'resources', 'icon.png') : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
      // Cache compiled UI code on the first run instead of after a few launches.
      v8CacheOptions: 'bypassHeatCheck',
    },
  });
  if (b.maximized) win.maximize();
  win.once('ready-to-show', () => win?.show());
  win.webContents.on('did-finish-load', connect);
  win.on('maximize', () => win?.webContents.send('win:maximized', true));
  win.on('unmaximize', () => win?.webContents.send('win:maximized', false));
  win.on('close', () => {
    if (!win) return;
    const bounds = win.getNormalBounds();
    try {
      fs.writeFileSync(boundsFile(), JSON.stringify({ ...bounds, maximized: win.isMaximized() }));
    } catch {}
  });
  win.on('closed', () => {
    win = null;
  });
  // Links open in the browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://') && !(DEV_URL && url.startsWith(DEV_URL))) e.preventDefault();
  });
  void win.loadURL(DEV_URL ?? 'app://exos/');
}

ipcMain.handle('win', (e, op: string) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return;
  if (op === 'minimize') w.minimize();
  else if (op === 'toggle-maximize') w.isMaximized() ? w.unmaximize() : w.maximize();
  else if (op === 'close') w.close();
});

ipcMain.handle('shell:reveal', (_e, p: string) => shell.showItemInFolder(p));
/** Opens a folder in the file manager, creating it first (the music folder appears with the first download). */
ipcMain.handle('shell:open-folder', async (_e, p: string) => {
  await fs.promises.mkdir(p, { recursive: true });
  const err = await shell.openPath(p);
  if (err) throw new Error(err);
});
ipcMain.handle('dialog:pick-folder', async (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  const r = w
    ? await dialog.showOpenDialog(w, { properties: ['openDirectory', 'createDirectory'] })
    : await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
  return r.canceled ? null : (r.filePaths[0] ?? null);
});

app.on('second-instance', () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

app.on('before-quit', () => {
  quitting = true;
});

app.on('window-all-closed', () => {
  quitting = true;
  engine?.kill();
  app.quit();
});

app.whenReady().then(() => {
  serveUi();
  startEngine();
  createWindow();
  app.on('activate', () => {
    if (!win) createWindow();
  });
});
