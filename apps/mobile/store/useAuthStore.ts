import { create } from 'zustand';

import { releaseAudio } from '@/services/audio/audioService';
import {
  type AuthUser,
  changePassword as apiChangePassword,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  resendCode as apiResendCode,
  updateProfile as apiUpdateProfile,
  verifyEmail as apiVerifyEmail,
  getMe,
  type UpdateProfilePayload,
} from '@/services/auth/authApi';
import { getAccessToken } from '@/services/auth/tokenStorage';

type AuthState = {
  user: AuthUser | null;
  isHydrated: boolean;
  isLoading: boolean;

  checkAuth: () => Promise<void>;
  register: (
    name: string,
    username: string,
    email: string,
    password: string,
  ) => Promise<{ userId: string; email: string }>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (userId: string, code: string) => Promise<void>;
  resendCode: (userId: string, email: string) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<AuthUser>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isHydrated: false,
  isLoading: false,

  setUser: (user) => set({ user }),

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await getAccessToken();
      if (!token) {
        set({ user: null, isHydrated: true, isLoading: false });
        return;
      }
      const me = await getMe();
      set({ user: me, isHydrated: true, isLoading: false });
    } catch {
      set({ user: null, isHydrated: true, isLoading: false });
    }
  },

  register: async (name, username, email, password) => {
    set({ isLoading: true });
    try {
      const created = await apiRegister(name, username, email, password);
      return { userId: created.id, email: created.email };
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      await apiLogin(username, password);
      const me = await getMe();
      set({ user: me });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiLogout();
    } finally {
      releaseAudio();
      set({ user: null, isLoading: false });
    }
  },

  verifyEmail: async (userId, code) => {
    set({ isLoading: true });
    try {
      await apiVerifyEmail(userId, code);
      // If user is currently signed in (rare for first verification), refresh profile
      if (get().user) {
        const me = await getMe();
        set({ user: me });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  resendCode: async (userId, email) => {
    await apiResendCode(userId, email);
  },

  updateProfile: async (payload) => {
    set({ isLoading: true });
    try {
      const me = await apiUpdateProfile(payload);
      set({ user: me });
      return me;
    } finally {
      set({ isLoading: false });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true });
    try {
      await apiChangePassword(currentPassword, newPassword);
      // Backend invalidates sessions — clear local user.
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
