import { api } from '@/lib/apiClient';

export interface PlanDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  maxUsers: number | null;
  maxProjects: number | null;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CreatePlanInput {
  code: string;
  name: string;
  description?: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  currency?: string;
  maxUsers?: number | null;
  maxProjects?: number | null;
  features?: string[];
  sortOrder: number;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string | null;
  monthlyPrice?: number;
  yearlyPrice?: number;
  currency?: string;
  maxUsers?: number | null;
  maxProjects?: number | null;
  features?: string[];
  sortOrder?: number;
}

export const plansService = {
  list: (includeInactive = true) =>
    api.get<PlanDto[]>(`/api/superadmin/plans?includeInactive=${includeInactive}`),
  get: (id: string) => api.get<PlanDto>(`/api/superadmin/plans/${id}`),
  create: (data: CreatePlanInput) => api.post<PlanDto>('/api/superadmin/plans', data),
  update: (id: string, data: UpdatePlanInput) => api.patch<PlanDto>(`/api/superadmin/plans/${id}`, data),
  activate: (id: string) => api.post<void>(`/api/superadmin/plans/${id}/activate`),
  deactivate: (id: string) => api.post<void>(`/api/superadmin/plans/${id}/deactivate`),
};
