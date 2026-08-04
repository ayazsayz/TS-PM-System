import { api } from '@/lib/apiClient';

export interface OrgDto {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateOrgInput {
  name: string;
  slug: string;
}

export interface UpdateOrgInput {
  name?: string;
  slug?: string;
}

export const organizationsService = {
  list: () => api.get<OrgDto[]>('/api/superadmin/organizations'),
  get: (id: string) => api.get<OrgDto>(`/api/superadmin/organizations/${id}`),
  create: (data: CreateOrgInput) => api.post<OrgDto>('/api/superadmin/organizations', data),
  update: (id: string, data: UpdateOrgInput) => api.patch<OrgDto>(`/api/superadmin/organizations/${id}`, data),
  suspend: (id: string) => api.post<void>(`/api/superadmin/organizations/${id}/suspend`),
  activate: (id: string) => api.post<void>(`/api/superadmin/organizations/${id}/activate`),
};
