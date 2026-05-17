import { apiPatch, apiPost, apiRequest } from '@/services/api/client';
import {
  clearTokens,
  getRefreshToken,
  saveTokens,
} from '@/services/auth/tokenStorage';

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RegisterResponse = {
  id: string;
  name: string;
  username: string;
  email: string;
  createdAt: string;
};

export type AuthTokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessExpiresIn: string;
};

export type AuthStatusResponse = {
  sub: string;
  username: string;
  sessionId: string;
  iat?: number;
  exp?: number;
};

export type VerifyEmailResponse = AuthTokenResponse & {
  success: boolean;
};

export type PasswordResetCodeResponse = {
  resetToken: string;
};

export async function register(
  name: string,
  username: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  return apiPost<RegisterResponse>(
    '/auth/register',
    { name, username, email, password },
    { skipAuth: true },
  );
}

export async function login(
  username: string,
  password: string,
): Promise<AuthTokenResponse> {
  const tokens = await apiPost<AuthTokenResponse>(
    '/auth/login',
    { username, password },
    { skipAuth: true },
  );
  await saveTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  try {
    if (refreshToken) {
      await apiPost<{ success: boolean }>(
        '/auth/logout',
        { refreshToken },
        { skipAuth: true },
      );
    }
  } catch {
  } finally {
    await clearTokens();
  }
}

export async function verifyEmail(
  userId: string,
  code: string,
): Promise<VerifyEmailResponse> {
  const tokens = await apiPost<VerifyEmailResponse>(
    '/auth/verify',
    { userId, code },
    { skipAuth: true },
  );
  await saveTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export async function resendCode(userId: string): Promise<void> {
  await apiPost<void>('/auth/verify/resend', { userId }, { skipAuth: true });
}

export async function checkAuthStatus(): Promise<AuthStatusResponse> {
  return apiRequest<AuthStatusResponse>('/auth/status', { method: 'GET' });
}

export async function forgotPassword(
  email: string,
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(
    '/auth/password/forgot',
    { email },
    { skipAuth: true },
  );
}

export async function verifyPasswordResetCode(
  email: string,
  code: string,
): Promise<PasswordResetCodeResponse> {
  return apiPost<PasswordResetCodeResponse>(
    '/auth/password/verify',
    { email, code },
    { skipAuth: true },
  );
}

export async function resetPassword(
  resetToken: string,
  newPassword: string,
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(
    '/auth/password/reset',
    { resetToken, newPassword },
    { skipAuth: true },
  );
}

export async function getMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/user/me', { method: 'GET' });
}

export type UpdateProfilePayload = {
  name?: string;
  username?: string;
  email?: string;
};

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<AuthUser> {
  return apiPatch<AuthUser>('/user/me', payload);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean }> {
  return apiPatch<{ success: boolean }>('/auth/password', {
    currentPassword,
    newPassword,
  });
}
