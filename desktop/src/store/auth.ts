import { create } from 'zustand';
import { hasTokens, setUnauthorizedHandler } from '@/lib/api';
import { IS_MOCK } from '@/lib/env';
import * as api from '@/lib/services';
import type { User } from '@/lib/types';
import { useCloud } from './cloud';

type AuthState = {
  status: 'loading' | 'signedOut' | 'signedIn';
  user: User | null;
  /** True from a sign-in until the shell has finished opening up. */
  entering: boolean;
  bootstrap: () => Promise<void>;
  /** `beforeEnter` runs once the server said yes, before the app replaces the sign-in screen. */
  login: (username: string, password: string, beforeEnter?: () => Promise<void>) => Promise<void>;
  /** Creates the account; the server mails a code to the address. */
  register: (input: { name: string; username: string; email: string; password: string }) => Promise<{ userId: string; email: string }>;
  /** A right code signs the new account straight in, like `login`. */
  verify: (userId: string, code: string, beforeEnter?: () => Promise<void>) => Promise<void>;
  resend: (userId: string) => Promise<void>;
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
  entering: false,
  bootstrap: async () => {
    setUnauthorizedHandler(() => {
      useCloud.getState().reset();
      set({ status: 'signedOut', user: null });
    });
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
  login: async (username, password, beforeEnter) => {
    await api.login(username, password);
    const [user] = await Promise.all([api.getMe().catch(() => null), beforeEnter?.()]);
    rememberUser(user);
    set({ status: 'signedIn', user, entering: true });
  },
  register: (input) => api.register(input),
  verify: async (userId, code, beforeEnter) => {
    await api.verifyEmail(userId, code);
    const [user] = await Promise.all([api.getMe().catch(() => null), beforeEnter?.()]);
    rememberUser(user);
    set({ status: 'signedIn', user, entering: true });
  },
  resend: (userId) => api.resendCode(userId),
  logout: async () => {
    await api.logout();
    rememberUser(null);
    useCloud.getState().reset();
    set({ status: 'signedOut', user: null });
  },
}));
