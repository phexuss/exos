import { create } from 'zustand';
import { hasTokens, setUnauthorizedHandler } from '@/lib/api';
import { IS_MOCK } from '@/lib/env';
import * as api from '@/lib/services';
import type { User } from '@/lib/types';

type AuthState = {
  status: 'loading' | 'signedOut' | 'signedIn';
  user: User | null;
  bootstrap: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const USER_KEY = 'exos.user';

function cachedUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as User | null;
  } catch {
    return null;
  }
}

function rememberUser(user: User | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {}
}

export const useAuth = create<AuthState>((set) => ({
  // Known before the first frame, so a returning user never sees a blank window.
  status: IS_MOCK || hasTokens() ? 'signedIn' : 'signedOut',
  user: cachedUser(),
  bootstrap: async () => {
    setUnauthorizedHandler(() => set({ status: 'signedOut', user: null }));
    if (!IS_MOCK && !hasTokens()) {
      set({ status: 'signedOut' });
      return;
    }
    // Saved tokens mean a session: draw the app now and let the server confirm
    // in the background. A refused token signs out through the 401 handler.
    set({ status: 'signedIn', user: cachedUser() });
    try {
      const user = await api.getMe();
      rememberUser(user);
      set({ user });
    } catch {
      if (!hasTokens()) set({ status: 'signedOut', user: null });
    }
  },
  login: async (username, password) => {
    await api.login(username, password);
    const user = await api.getMe().catch(() => null);
    rememberUser(user);
    set({ status: 'signedIn', user });
  },
  logout: async () => {
    await api.logout();
    rememberUser(null);
    set({ status: 'signedOut', user: null });
  },
}));
