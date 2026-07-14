import { create } from 'zustand';
import { approvalsService, notificationsService, type Notification } from '@/services/workspaceService';

/**
 * Cross-screen counters shown in the app chrome (sidebar approvals badge, the
 * notification bell). Screens call refresh() after they change something so the
 * chrome stays in sync.
 */
interface WorkspaceState {
  pendingApprovals: number;
  notifications: Notification[];
  unread: number;

  refreshApprovals: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  pendingApprovals: 0,
  notifications: [],
  unread: 0,

  refreshApprovals: async () => {
    try {
      const pending = await approvalsService.list('pending');
      set({ pendingApprovals: pending.length });
    } catch {
      // Non-managers get 403 here — simply show no badge.
      set({ pendingApprovals: 0 });
    }
  },

  refreshNotifications: async () => {
    try {
      const { unread, items } = await notificationsService.list();
      set({ unread, notifications: items });
    } catch {
      set({ unread: 0, notifications: [] });
    }
  },

  markAllRead: async () => {
    await notificationsService.markAllRead();
    set((s) => ({ unread: 0, notifications: s.notifications.map((n) => ({ ...n, isRead: true })) }));
  },

  reset: () => set({ pendingApprovals: 0, notifications: [], unread: 0 }),
}));
