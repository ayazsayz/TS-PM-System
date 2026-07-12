import { create } from 'zustand';
import { currentUser, type CurrentUser } from '@/config/brand';

interface AuthState {
  isAuthed: boolean;
  user: CurrentUser;
  login: () => void;
  logout: () => void;
}

/**
 * Simulated auth. There's no real session/backend in this UI build — login()
 * just flips the flag so route guards let you through. Swap for real auth later.
 */
export const useAuthStore = create<AuthState>((set) => ({
  isAuthed: false,
  user: currentUser,
  login: () => set({ isAuthed: true }),
  logout: () => set({ isAuthed: false }),
}));
