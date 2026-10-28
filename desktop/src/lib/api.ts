import { API_BASE_URL, IS_TAURI } from './env';

/**
 * The API's CORS list only allows the web app, so inside Tauri requests go
 * through the HTTP plugin (Rust side, no CORS) instead of the webview fetch.
 * The plugin adds `Origin: tauri://localhost` by default, which the API's
 * CORS check rejects; an empty Origin makes it drop the header.
 */
let fetchImpl: typeof fetch = (...args) => fetch(...args);
if (IS_TAURI) {
  const pluginFetch = import('@tauri-apps/plugin-http').then((m) => m.fetch);
  fetchImpl = async (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set('Origin', '');
    return (await pluginFetch)(input, { ...init, headers });
  };
}

const ACCESS_KEY = 'exos.accessToken';
const REFRESH_KEY = 'exos.refreshToken';
const REFRESH_SKEW_MS = 30_000;

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveTokens(access: string, refresh: string): void {
  try {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  } catch {}
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {}
}

export function hasTokens(): boolean {
  return !!storageGet(REFRESH_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

function jwtExpiresAt(token: string): number | null {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(atob(part + '='.repeat((4 - (part.length % 4)) % 4)));
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const refreshToken = storageGet(REFRESH_KEY);
      if (!refreshToken) return null;
      const res = await fetchImpl(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        if ([400, 401, 403].includes(res.status)) clearTokens();
        return null;
      }
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      saveTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function tokenForRequest(): Promise<string | null> {
  const token = storageGet(ACCESS_KEY);
  if (!token) return refreshAccessToken();
  const exp = jwtExpiresAt(token);
  if (exp === null || exp > Date.now() + REFRESH_SKEW_MS) return token;
  return (await refreshAccessToken()) ?? (exp > Date.now() ? token : null);
}

type Params = Record<string, string | number | undefined>;

function buildUrl(path: string, params?: Params): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function errorFrom(res: Response, path: string): Promise<ApiError> {
  let message = `API ${res.status}: ${path}`;
  try {
    const body = (await res.json()) as { message?: unknown };
    if (typeof body.message === 'string') message = body.message;
    else if (Array.isArray(body.message) && typeof body.message[0] === 'string')
      message = body.message[0];
  } catch {}
  return new ApiError(res.status, message);
}

export async function apiRequest<T>(
  path: string,
  opts: { method?: string; body?: unknown; params?: Params; skipAuth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, params, skipAuth } = opts;
  const url = buildUrl(path, params);
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!skipAuth) {
    const token = await tokenForRequest();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const send = () =>
    fetchImpl(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let res = await send();
  if (res.status === 401 && !skipAuth) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      headers.Authorization = `Bearer ${fresh}`;
      res = await send();
    } else {
      onUnauthorized?.();
    }
  }
  if (!res.ok) throw await errorFrom(res, path);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const apiGet = <T>(path: string, params?: Params) =>
  apiRequest<T>(path, { params });

export const apiPost = <T>(path: string, body?: unknown, skipAuth = false) =>
  apiRequest<T>(path, { method: 'POST', body, skipAuth });
