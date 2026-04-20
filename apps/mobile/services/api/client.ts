import Constants from 'expo-constants';

function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  const configUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (configUrl) return configUrl;

  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.experienceUrl ?? '';
    const lanIp = debuggerHost.split(':')[0];
    if (lanIp) return `http://${lanIp}:3000/api`;
    return 'http://localhost:3000/api';
  }

  return 'https://api.example.com/api';
}

export const API_BASE_URL = resolveBaseUrl();

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  if (__DEV__) console.log('[API]', url);

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  if (__DEV__) console.log('[API POST]', url, body);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}
