import { api } from '@/lib/apiClient';

export interface TimeEntry {
  id: string;
  projectId: string;
  projectName: string;
  projectColor: string;
  date: string;
  task: string;
  description: string | null;
  start: string | null;
  end: string | null;
  break: string | null;
  billable: boolean;
  hours: number;
}

export interface UpsertTimeEntryPayload {
  projectId: string;
  date: string;
  task: string;
  description?: string | null;
  start?: string | null;
  end?: string | null;
  break?: string | null;
  billable: boolean;
  hours: number;
}

export const timeEntriesService = {
  byDate: (date: string) => api.get<TimeEntry[]>(`/api/time-entries?date=${date}`),
  byWeek: (weekStart: string) => api.get<TimeEntry[]>(`/api/time-entries?weekStart=${weekStart}`),
  create: (payload: UpsertTimeEntryPayload) => api.post<TimeEntry>('/api/time-entries', payload),
  update: (id: string, payload: UpsertTimeEntryPayload) =>
    api.put<TimeEntry>(`/api/time-entries/${id}`, payload),
  remove: (id: string) => api.del<void>(`/api/time-entries/${id}`),
  duplicateDay: (fromDate: string, toDate: string) =>
    api.post<{ copied: number }>('/api/time-entries/duplicate', { fromDate, toDate }),
};

export type TimesheetStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';

export interface WeekRow {
  projectId: string;
  projectName: string;
  client: string;
  colorHex: string;
  task: string;
  cells: number[];
  total: number;
}

export interface WeeklyTimesheet {
  weekStart: string;
  status: TimesheetStatus;
  totalHours: number;
  weekPercent: number;
  remaining: number;
  billablePercent: number;
  dayTotals: number[];
  rows: WeekRow[];
}

export const timesheetsService = {
  week: (weekStart: string) => api.get<WeeklyTimesheet>(`/api/timesheets?weekStart=${weekStart}`),
  submit: (weekStart: string) =>
    api.post<WeeklyTimesheet>(`/api/timesheets/submit?weekStart=${weekStart}`),
  /** Upsert a single cell (project × task × day). */
  setCell: (
    weekStart: string,
    cell: { projectId: string; task: string; date: string; hours: number },
  ) => api.put<WeeklyTimesheet>(`/api/timesheets/cell?weekStart=${weekStart}`, cell),
};
