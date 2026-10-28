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

export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  bootstrap: async () => {
    setUnauthorizedHandler(() => set({ status: 'signedOut', user: null }));
    if (!IS_MOCK && !hasTokens()) {
      set({ status: 'signedOut' });
      return;
    }
    try {
      set({ user: await api.getMe(), status: 'signedIn' });
    } catch {
      set({ status: hasTokens() ? 'signedIn' : 'signedOut' });
    }
  },
  login: async (username, password) => {
    await api.login(username, password);
    set({ status: 'signedIn', user: await api.getMe().catch(() => null) });
  },
  logout: async () => {
    await api.logout();
    set({ status: 'signedOut', user: null });
  },
}));
