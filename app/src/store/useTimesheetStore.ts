import { create } from 'zustand';
import {
  approvals as seedApprovals,
  entriesByDay as seedEntries,
  initialActiveDay,
  initialWeekIdx,
  tasks as seedTasks,
  weekRows as seedWeekRows,
} from '@/lib/mockData';
import type {
  Approval,
  ApprovalStatus,
  EntriesByDay,
  Task,
  TimeEntry,
  WeekRow,
  WeekStatus,
} from '@/lib/types';
import { useUiStore } from './useUiStore';

const toast = (msg: string) => useUiStore.getState().showToast(msg);

interface TimesheetState {
  // ---- Daily entry ----
  activeDay: number;
  entriesByDay: EntriesByDay;
  setActiveDay: (i: number) => void;
  updateEntry: (index: number, field: keyof TimeEntry, value: TimeEntry[keyof TimeEntry]) => void;
  addEntry: (p?: number) => void;
  removeEntry: (index: number) => void;
  duplicateYesterday: () => void;

  // ---- Weekly grid ----
  weekRows: WeekRow[];
  weekIdx: number;
  weekStatus: WeekStatus;
  setCell: (rowIndex: number, cellIndex: number, value: string) => void;
  addWeekRow: () => void;
  removeWeekRow: (rowIndex: number) => void;
  prevWeek: () => void;
  nextWeek: () => void;
  submitWeek: () => void;

  // ---- Tasks ----
  tasks: Task[];
  toggleTask: (id: number) => void;

  // ---- Approvals ----
  approvals: Approval[];
  sel: Record<string, boolean>;
  decide: (id: string, status: ApprovalStatus) => void;
  toggleSel: (id: string) => void;
  clearSel: () => void;
  bulkApprove: () => void;

  // ---- Projects ----
  projFilter: string;
  setProjFilter: (f: string) => void;
}

export const useTimesheetStore = create<TimesheetState>((set, get) => ({
  // ---- Daily entry ----
  activeDay: initialActiveDay,
  entriesByDay: seedEntries,
  setActiveDay: (activeDay) => set({ activeDay }),
  updateEntry: (index, field, value) => {
    const d = get().activeDay;
    set((s) => {
      const list = (s.entriesByDay[d] || []).map((e, j) =>
        j === index ? { ...e, [field]: value } : e,
      );
      return { entriesByDay: { ...s.entriesByDay, [d]: list } };
    });
  },
  addEntry: (p = 0) => {
    const d = get().activeDay;
    const blank: TimeEntry = { p, task: '', desc: '', start: '', end: '', brk: '', billable: true, hours: '' };
    set((s) => ({ entriesByDay: { ...s.entriesByDay, [d]: [...(s.entriesByDay[d] || []), blank] } }));
  },
  removeEntry: (index) => {
    const d = get().activeDay;
    set((s) => ({
      entriesByDay: { ...s.entriesByDay, [d]: (s.entriesByDay[d] || []).filter((_, j) => j !== index) },
    }));
  },
  duplicateYesterday: () => {
    const d = get().activeDay;
    if (d === 0) {
      toast('No previous day in this week');
      return;
    }
    const prev = get().entriesByDay[d - 1] || [];
    if (!prev.length) {
      toast('No entries to copy from yesterday');
      return;
    }
    set((s) => ({ entriesByDay: { ...s.entriesByDay, [d]: prev.map((e) => ({ ...e })) } }));
    toast(`Copied ${prev.length} entries from yesterday`);
  },

  // ---- Weekly grid ----
  weekRows: seedWeekRows,
  weekIdx: initialWeekIdx,
  weekStatus: 'Draft',
  setCell: (rowIndex, cellIndex, value) => {
    set((s) => ({
      weekRows: s.weekRows.map((r, i) =>
        i === rowIndex
          ? {
              ...r,
              hours: r.hours.map((h, j) => (j === cellIndex ? (value === '' ? '' : parseFloat(value) || 0) : h)),
            }
          : r,
      ),
    }));
  },
  addWeekRow: () =>
    set((s) => ({ weekRows: [...s.weekRows, { p: 6, task: '', hours: ['', '', '', '', '', '', ''] }] })),
  removeWeekRow: (rowIndex) =>
    set((s) => ({ weekRows: s.weekRows.filter((_, j) => j !== rowIndex) })),
  prevWeek: () => set((s) => ({ weekIdx: Math.max(0, s.weekIdx - 1) })),
  nextWeek: () => set((s) => ({ weekIdx: Math.min(3, s.weekIdx + 1) })),
  submitWeek: () => {
    if (get().weekStatus !== 'Draft') return;
    set({ weekStatus: 'Pending' });
    toast('Timesheet submitted — pending approval');
  },

  // ---- Tasks ----
  tasks: seedTasks,
  toggleTask: (id) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),

  // ---- Approvals ----
  approvals: seedApprovals,
  sel: {},
  decide: (id, status) => {
    set((s) => ({
      approvals: s.approvals.map((a) => (a.id === id ? { ...a, status } : a)),
      sel: { ...s.sel, [id]: false },
    }));
    toast(status === 'Approved' ? 'Timesheet approved' : 'Timesheet rejected — employee notified');
  },
  toggleSel: (id) => set((s) => ({ sel: { ...s.sel, [id]: !s.sel[id] } })),
  clearSel: () => set({ sel: {} }),
  bulkApprove: () => {
    const selIds = Object.keys(get().sel).filter((id) => get().sel[id]);
    set((s) => ({
      approvals: s.approvals.map((a) =>
        selIds.includes(a.id) && a.status === 'Pending' ? { ...a, status: 'Approved' } : a,
      ),
      sel: {},
    }));
    toast(`${selIds.length} timesheets approved`);
  },

  // ---- Projects ----
  projFilter: 'All',
  setProjFilter: (projFilter) => set({ projFilter }),
}));

/** Count of timesheets still pending (used for the sidebar badge). */
export const selectPendingCount = (s: TimesheetState) =>
  s.approvals.filter((a) => a.status === 'Pending').length;
