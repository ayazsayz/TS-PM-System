import { api } from '@/lib/apiClient';

export type ProjectHealth = 'On track' | 'At risk' | 'Over budget' | 'Delayed' | 'Completed';

export const PROJECT_HEALTHS: ProjectHealth[] = [
  'On track',
  'At risk',
  'Over budget',
  'Delayed',
  'Completed',
];

/** Swatch palette offered when creating a project. */
export const PROJECT_COLORS = [
  '#4757E6',
  '#0E9384',
  '#B54708',
  '#7839EE',
  '#C11574',
  '#175CD3',
  '#667085',
];

export interface ProjectTeamMember {
  userId: string;
  initials: string;
  avatarColor: string;
  fullName: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  client: string;
  colorHex: string;
  estimatedHours: number;
  /** Computed from logged time. */
  actualHours: number;
  remainingHours: number;
  budget: number;
  hourlyRate: number;
  /** Computed: actualHours × hourlyRate. */
  spent: number;
  budgetPercent: number;
  due: string | null;
  health: ProjectHealth;
  completionPct: number;
  warn: string | null;
  isInternal: boolean;
  isArchived: boolean;
  team: ProjectTeamMember[];
}

export interface MyProject {
  id: string;
  name: string;
  client: string;
  colorHex: string;
  completionPct: number;
}

export interface UpsertProjectPayload {
  name: string;
  clientId: string;
  colorHex: string;
  estimatedHours: number;
  budget: number;
  hourlyRate: number;
  dueDate: string | null;
  health: ProjectHealth;
  completionPct: number;
  warn: string | null;
  isInternal: boolean;
  teamUserIds: string[];
}

export const projectsService = {
  list(filter?: string, includeArchived = false) {
    const params = new URLSearchParams();
    if (filter && filter !== 'All') params.set('filter', filter.toLowerCase().replace(' ', '-'));
    if (includeArchived) params.set('includeArchived', 'true');
    const qs = params.toString();
    return api.get<Project[]>(`/api/projects${qs ? `?${qs}` : ''}`);
  },
  mine: () => api.get<MyProject[]>('/api/projects/mine'),
  get: (id: string) => api.get<Project>(`/api/projects/${id}`),
  create: (payload: UpsertProjectPayload) => api.post<Project>('/api/projects', payload),
  update: (id: string, payload: UpsertProjectPayload) =>
    api.put<Project>(`/api/projects/${id}`, payload),
  setArchived: (id: string, isArchived: boolean) =>
    api.patch<Project>(`/api/projects/${id}/archive`, { isArchived }),
  remove: (id: string) => api.del<void>(`/api/projects/${id}`),
};

export interface Client {
  id: string;
  name: string;
  isArchived: boolean;
  projectCount: number;
}

export const clientsService = {
  list: (includeArchived = false) =>
    api.get<Client[]>(`/api/clients${includeArchived ? '?includeArchived=true' : ''}`),
  create: (name: string) => api.post<Client>('/api/clients', { name }),
  update: (id: string, name: string) => api.put<Client>(`/api/clients/${id}`, { name }),
  setArchived: (id: string, isArchived: boolean) =>
    api.patch<Client>(`/api/clients/${id}/archive`, { isArchived }),
  remove: (id: string) => api.del<void>(`/api/clients/${id}`),
};

export interface UserPickerItem {
  id: string;
  fullName: string;
  initials: string;
  avatarColor: string;
  department: string | null;
}

export const directoryService = {
  users: () => api.get<UserPickerItem[]>('/api/users'),
};
