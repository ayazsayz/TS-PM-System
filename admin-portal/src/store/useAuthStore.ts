import { create } from 'zustand';
import { authService, type ApiUser } from '@/services/authService';
import { tokenStore } from '@/lib/apiClient';

interface AuthState {
  user: ApiUser | null;
  isAuthed: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthed: false,
  loading: true,

  login: async (email, password) => {
    const res = await authService.login(email, password);
    set({ user: res.user, isAuthed: true, loading: false });
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthed: false, loading: false });
  },

  restore: async () => {
    if (!tokenStore.access) {
      set({ loading: false });
      return;
    }
    try {
      const user = await authService.me();
      set({ user, isAuthed: true, loading: false });
    } catch {
      tokenStore.clear();
      set({ user: null, isAuthed: false, loading: false });
    }
  },

  hasRole: (role) => get().user?.roles.includes(role) ?? false,
}));
