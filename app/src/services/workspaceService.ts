import { api } from '@/lib/apiClient';

// ---- Dashboards ----

export interface EmployeeDashboard {
  referenceDate: string;
  todayHours: number;
  dayTarget: number;
  weekHours: number;
  weekTarget: number;
  weekPercent: number;
  billablePercent: number;
  pendingWeeks: number;
}

export interface ManagerDashboard {
  pendingApprovals: number;
  pendingHours: number;
  missingTimesheets: number;
  teamUtilizationPercent: number;
  projectsAtRisk: number;
}

export const dashboardService = {
  employee: () => api.get<EmployeeDashboard>('/api/dashboard/employee'),
  manager: () => api.get<ManagerDashboard>('/api/dashboard/manager'),
};

// ---- Tasks ----

export interface Task {
  id: string;
  label: string;
  done: boolean;
  due: string | null;
  urgent: boolean;
  projectId: string | null;
  projectName: string | null;
  projectColor: string | null;
}

export const tasksService = {
  list: () => api.get<Task[]>('/api/tasks'),
  create: (payload: { label: string; projectId?: string | null; due?: string | null; urgent: boolean }) =>
    api.post<Task>('/api/tasks', payload),
  toggle: (id: string) => api.patch<Task>(`/api/tasks/${id}/toggle`),
  remove: (id: string) => api.del<void>(`/api/tasks/${id}`),
};

// ---- Team ----

export interface Utilization {
  userId: string;
  name: string;
  initials: string;
  avatarColor: string;
  utilizationPercent: number;
}

export interface MissingTimesheet {
  userId: string;
  name: string;
  initials: string;
  department: string;
  avatarColor: string;
}

export interface TopPerformer {
  rank: number;
  name: string;
  initials: string;
  avatarColor: string;
  utilizationPercent: number;
}

export const teamService = {
  utilization: () => api.get<Utilization[]>('/api/team/utilization'),
  missing: () => api.get<MissingTimesheet[]>('/api/team/missing'),
  topPerformers: () => api.get<TopPerformer[]>('/api/team/top-performers'),
};

// ---- Approvals ----

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Approval {
  id: string;
  userId: string;
  name: string;
  initials: string;
  department: string;
  avatarColor: string;
  week: string;
  hours: number;
  billablePercent: number;
  status: ApprovalStatus;
  submitted: string | null;
  flag: string | null;
  isPending: boolean;
}

export interface ApprovalHistory {
  action: string;
  message: string;
  timestamp: string;
}

export const approvalsService = {
  list: (status?: string) =>
    api.get<Approval[]>(`/api/approvals${status ? `?status=${status}` : ''}`),
  approve: (id: string) => api.post<Approval>(`/api/approvals/${id}/approve`),
  reject: (id: string, comment: string | null) =>
    api.post<Approval>(`/api/approvals/${id}/reject`, { comment }),
  bulkApprove: (ids: string[]) => api.post<{ approved: number }>('/api/approvals/bulk-approve', { ids }),
  history: () => api.get<ApprovalHistory[]>('/api/approvals/history'),
};

// ---- Reports ----

export interface EstVsActual {
  project: string;
  estimated: number;
  actual: number;
  percent: number;
}

export interface ClientBilling {
  client: string;
  hours: number;
  spend: number;
  projects: number;
}

export interface ReportsSummary {
  totalBudget: number;
  totalSpent: number;
  budgetUsedPercent: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  avgUtilizationPercent: number;
  billableSplit: {
    billableHours: number;
    nonBillableHours: number;
    billablePercent: number;
  };
  estVsActual: EstVsActual[];
  clientBilling: ClientBilling[];
}

export const reportsService = {
  summary: () => api.get<ReportsSummary>('/api/reports/summary'),
};

// ---- Notifications ----

export interface Notification {
  id: string;
  title: string;
  body: string | null;
  category: string | null;
  severity: 'info' | 'success' | 'warning' | 'danger';
  isRead: boolean;
  ago: string;
}

export interface NotificationList {
  unread: number;
  items: Notification[];
}

export const notificationsService = {
  list: () => api.get<NotificationList>('/api/notifications'),
  markAllRead: () => api.post<void>('/api/notifications/mark-all-read'),
};
