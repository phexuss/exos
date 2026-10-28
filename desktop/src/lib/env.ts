/** True inside the Tauri shell; false in a plain browser (prototype / vite dev). */
export const IS_TAURI =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/** Mock data and a fake engine: the design prototype and browser dev. */
export const IS_MOCK = !IS_TAURI || import.meta.env.VITE_MOCK === '1';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? 'https://exos-api.phexuss.dev/api'
).replace(/\/$/, '');
