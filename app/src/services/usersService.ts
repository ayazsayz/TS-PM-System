import { api } from '@/lib/apiClient';

export type UserStatus = 'Active' | 'Invited' | 'Inactive';
export type AppRole = 'Employee' | 'Manager' | 'Admin';

export const ALL_ROLES: AppRole[] = ['Employee', 'Manager', 'Admin'];

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  initials: string;
  title: string | null;
  department: string | null;
  avatarColor: string;
  roles: AppRole[];
  isActive: boolean;
  mustChangePassword: boolean;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  title?: string;
  department?: string;
  avatarColor?: string;
  roles: AppRole[];
}

export interface CreateUserResult {
  user: AdminUser;
  /** Shown to the admin exactly once — never retrievable again. */
  oneTimePassword: string;
}

export interface UpdateUserPayload {
  fullName: string;
  title?: string;
  department?: string;
  avatarColor?: string;
}

interface ListFilters {
  search?: string;
  role?: string;
  status?: string;
}

export const usersService = {
  list(filters: ListFilters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.role) params.set('role', filters.role);
    if (filters.status) params.set('status', filters.status);
    const qs = params.toString();
    return api.get<AdminUser[]>(`/api/admin/users${qs ? `?${qs}` : ''}`);
  },

  create: (payload: CreateUserPayload) => api.post<CreateUserResult>('/api/admin/users', payload),

  update: (id: string, payload: UpdateUserPayload) =>
    api.put<AdminUser>(`/api/admin/users/${id}`, payload),

  setRoles: (id: string, roles: AppRole[]) =>
    api.put<AdminUser>(`/api/admin/users/${id}/roles`, { roles }),

  setStatus: (id: string, isActive: boolean) =>
    api.patch<AdminUser>(`/api/admin/users/${id}/status`, { isActive }),

  resetPassword: (id: string) =>
    api.post<{ oneTimePassword: string }>(`/api/admin/users/${id}/reset-password`),
};
