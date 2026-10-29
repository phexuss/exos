import { bridge } from './bridge';

/** True inside the Electron shell; false in a plain browser (prototype / vite dev). */
export const IS_DESKTOP = !!bridge;

export const IS_MAC = bridge?.platform === 'darwin';

/** Mock data and a fake engine: the design prototype and browser dev. */
export const IS_MOCK = !IS_DESKTOP || import.meta.env.VITE_MOCK === '1';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? 'https://exos-api.phexuss.dev/api'
).replace(/\/$/, '');
