import type { Tone } from '@/components';
import type { ApprovalStatus, ProjectHealth, TimeEntry, WeekStatus } from './types';

/** Standard hours in a work day / week. */
export const DAY_HOURS = 8;
export const WEEK_HOURS = 40;

/** Format an hours number without trailing zeros: 2 → "2", 2.5 → "2.5". */
export function fmtH(n: number): string {
  return String(parseFloat((Math.round(n * 100) / 100).toFixed(2)));
}

/** Sum the numeric hours in a list of entries (ignores blanks). */
export function sumEntries(entries: TimeEntry[]): number {
  return entries.reduce((t, e) => t + (parseFloat(String(e.hours)) || 0), 0);
}

/** Sum a row/column of week cells. */
export function sumCells(cells: (number | '')[]): number {
  return cells.reduce<number>((t, h) => t + (parseFloat(String(h)) || 0), 0);
}

/** Clamp to 0–100. */
export function pct(value: number, of: number): number {
  return of === 0 ? 0 : Math.min(100, (value / of) * 100);
}

/** Day progress-bar color: over = amber, complete = green, else accent. */
export function dayBarColor(total: number): string {
  if (total > DAY_HOURS) return 'var(--amber)';
  if (total >= DAY_HOURS) return 'var(--green)';
  return 'var(--accent)';
}

/** Badge tone for a project health label. */
export function healthTone(health: ProjectHealth): Tone {
  switch (health) {
    case 'On track':
      return 'green';
    case 'At risk':
      return 'amber';
    case 'Over budget':
    case 'Delayed':
      return 'red';
    case 'Completed':
      return 'neutral';
  }
}

/** Badge tone for a weekly-timesheet status. */
export function weekStatusTone(status: WeekStatus): Tone {
  if (status === 'Pending') return 'amber';
  if (status === 'Approved') return 'green';
  return 'neutral';
}

/** Badge tone for an approval status. */
export function approvalTone(status: ApprovalStatus): Tone {
  if (status === 'Pending') return 'amber';
  if (status === 'Approved') return 'green';
  return 'red';
}

/** Budget usage color: >100% red, >90% amber, else accent. */
export function budgetColor(usedPct: number): string {
  if (usedPct > 100) return 'var(--red)';
  if (usedPct > 90) return 'var(--amber)';
  return 'var(--accent)';
}
