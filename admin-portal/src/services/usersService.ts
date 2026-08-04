import { api } from '@/lib/apiClient';

export type UserRole = 'Employee' | 'Manager' | 'Admin' | 'SuperAdmin';
export type UserStatus = 'Active' | 'Invited' | 'Inactive';

export interface SuperAdminUserDto {
  id: string;
  email: string;
  fullName: string;
  initials: string;
  avatarColor: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  roles: UserRole[];
  isActive: boolean;
  mustChangePassword: boolean;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ListUsersFilters {
  search?: string;
  organizationId?: string;
  role?: UserRole;
  status?: UserStatus;
}

function toQuery(filters: ListUsersFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.organizationId) params.set('organizationId', filters.organizationId);
  if (filters.role) params.set('role', filters.role);
  if (filters.status) params.set('status', filters.status);
  const q = params.toString();
  return q ? `?${q}` : '';
}

export interface ImpersonationResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  organizationId: string;
  organizationName: string;
}

export const usersService = {
  list: (filters: ListUsersFilters = {}) =>
    api.get<SuperAdminUserDto[]>(`/api/superadmin/users${toQuery(filters)}`),
  get: (id: string) => api.get<SuperAdminUserDto>(`/api/superadmin/users/${id}`),
  activate: (id: string) => api.post<SuperAdminUserDto>(`/api/superadmin/users/${id}/activate`),
  deactivate: (id: string) => api.post<SuperAdminUserDto>(`/api/superadmin/users/${id}/deactivate`),
  setRoles: (id: string, roles: UserRole[]) =>
    api.put<SuperAdminUserDto>(`/api/superadmin/users/${id}/roles`, { roles }),
  resetPassword: (id: string) =>
    api.post<{ oneTimePassword: string }>(`/api/superadmin/users/${id}/reset-password`),
  impersonate: (id: string) =>
    api.post<ImpersonationResponse>(`/api/superadmin/users/${id}/impersonate`),
};
