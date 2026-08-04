import { api } from '@/lib/apiClient';

export interface AuditLogDto {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  organizationId: string;
  organizationName: string;
  action: string;
  message: string;
  targetType: string | null;
  targetId: string | null;
}

export interface AuditLogFilters {
  search?: string;
  organizationId?: string;
  actorId?: string;
  action?: string;
  from?: string;
  to?: string;
  take?: number;
}

function toQuery(filters: AuditLogFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.organizationId) params.set('organizationId', filters.organizationId);
  if (filters.actorId) params.set('actorId', filters.actorId);
  if (filters.action) params.set('action', filters.action);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.take) params.set('take', String(filters.take));
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const auditService = {
  list: (filters: AuditLogFilters = {}) =>
    api.get<AuditLogDto[]>(`/api/superadmin/audit${toQuery(filters)}`),
  listActions: () => api.get<string[]>(`/api/superadmin/audit/actions`),
};
