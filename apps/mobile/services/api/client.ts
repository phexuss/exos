import Constants from 'expo-constants';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '@/services/auth/tokenStorage';

function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  const configUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (configUrl) return configUrl;

  if (__DEV__) {
    const debuggerHost =
      Constants.expoConfig?.hostUri ?? Constants.experienceUrl ?? '';
    const lanIp = debuggerHost.split(':')[0];
    if (lanIp) return `http://${lanIp}:3000/api`;
    return 'http://localhost:3000/api';
  }

  return 'https://api.example.com/api';
}

export const API_BASE_URL = resolveBaseUrl();

const TOKEN_REFRESH_SKEW_MS = 30_000;

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | undefined>;
  /** When true, the request will not automatically attach the bearer token. */
  skipAuth?: boolean;
};

type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresIn: string;
};

type JwtExpiryPayload = {
  exp?: unknown;
};

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

let refreshInFlight: Promise<string | null> | null = null;

function getJwtExpiresAt(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = globalThis.atob(`${base64}${padding}`);
    const parsed = JSON.parse(decoded) as JwtExpiryPayload;

    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isAccessTokenExpired(token: string): boolean {
  const expiresAt = getJwtExpiresAt(token);
  return expiresAt !== null && expiresAt <= Date.now();
}

function shouldRefreshAccessToken(token: string): boolean {
  const expiresAt = getJwtExpiresAt(token);
  return expiresAt !== null && expiresAt <= Date.now() + TOKEN_REFRESH_SKEW_MS;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;

      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        if ([400, 401, 403].includes(res.status)) {
          await clearTokens();
        }
        return null;
      }

      const data = (await res.json()) as RefreshTokenResponse;
      await saveTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function getAccessTokenForRequest(): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) return refreshAccessToken();

  if (!shouldRefreshAccessToken(token)) {
    return token;
  }

  const refreshedToken = await refreshAccessToken();
  if (refreshedToken) return refreshedToken;

  return isAccessTokenExpired(token) ? null : token;
}

function buildUrl(path: string, params?: Record<string, string | undefined>) {
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v != null && v !== '')
      .map(
        ([k, v]) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`,
      )
      .join('&');
    if (qs) url += `?${qs}`;
  }
  return url;
}

async function parseError(res: Response, path: string): Promise<ApiError> {
  let body: unknown = null;
  let message = `API ${res.status}: ${path}`;
  try {
    body = await res.json();
    if (body && typeof body === 'object' && 'message' in body) {
      const m = (body as { message: unknown }).message;
      if (typeof m === 'string') message = m;
      else if (Array.isArray(m) && typeof m[0] === 'string') message = m[0];
    }
  } catch {
    // ignore
  }
  return new ApiError(res.status, message, body);
}

export async function getAuthorizedHeaders(
  options: { forceRefresh?: boolean } = {},
): Promise<Record<string, string>> {
  const token = options.forceRefresh
    ? await refreshAccessToken()
    : await getAccessTokenForRequest();

  if (!token) {
    onUnauthorized?.();
    throw new ApiError(401, 'Authentication required');
  }

  return { Authorization: `Bearer ${token}` };
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, params, skipAuth = false } = options;
  const url = buildUrl(path, params);

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const token = await getAccessTokenForRequest();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  if (__DEV__) console.log(`[API ${method}]`, url);

  let res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Auto-refresh on 401 (unless we already tried without auth)
  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } else {
      onUnauthorized?.();
    }
  }

  if (!res.ok) {
    throw await parseError(res, path);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

export function apiGet<T>(
  path: string,
  params?: Record<string, string | undefined>,
): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', params });
}

export function apiPost<T>(
  path: string,
  body: unknown,
  options?: { skipAuth?: boolean },
): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body,
    skipAuth: options?.skipAuth,
  });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'PATCH', body });
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' });
}
