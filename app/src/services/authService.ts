import { api, tokenStore } from '@/lib/apiClient';

export interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  initials: string;
  title: string | null;
  department: string | null;
  avatarColor: string;
  roles: string[];
  mustChangePassword: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: ApiUser;
  mustChangePassword: boolean;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/api/auth/login', { email, password }, true);
    tokenStore.set(res.accessToken, res.refreshToken);
    return res;
  },

  /** Serves both the forced first-login change and a voluntary change. */
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
    tokenStore.set(res.accessToken, res.refreshToken);
    return res;
  },

  me: () => api.get<ApiUser>('/api/auth/me'),

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } finally {
      tokenStore.clear();
    }
  },
};
