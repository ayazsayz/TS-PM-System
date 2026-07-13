import { create } from 'zustand';
import { tokenStore } from '@/lib/apiClient';
import { authService, type ApiUser } from '@/services/authService';

interface AuthState {
  user: ApiUser | null;
  isAuthed: boolean;
  /** True while the user is still on an admin-issued one-time password. */
  mustChangePassword: boolean;
  /** True until the initial session restore finishes (avoids a login-page flash). */
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Restore a session from a persisted token on app start. */
  restore: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthed: false,
  mustChangePassword: false,
  loading: true,

  login: async (email, password) => {
    const res = await authService.login(email, password);
    set({
      user: res.user,
      isAuthed: true,
      mustChangePassword: res.mustChangePassword,
      loading: false,
    });
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await authService.changePassword(currentPassword, newPassword);
    set({ user: res.user, isAuthed: true, mustChangePassword: false });
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthed: false, mustChangePassword: false, loading: false });
  },

  restore: async () => {
    if (!tokenStore.access) {
      set({ loading: false });
      return;
    }
    try {
      const user = await authService.me();
      set({
        user,
        isAuthed: true,
        mustChangePassword: user.mustChangePassword,
        loading: false,
      });
    } catch {
      tokenStore.clear();
      set({ user: null, isAuthed: false, mustChangePassword: false, loading: false });
    }
  },

  hasRole: (role) => get().user?.roles.includes(role) ?? false,
}));
