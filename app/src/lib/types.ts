/** Domain models — shapes ported from the mockup's data layer. */

export type ProjectHealth = 'On track' | 'At risk' | 'Over budget' | 'Delayed' | 'Completed';

export interface Project {
  name: string;
  client: string;
  /** Swatch color (hex). */
  color: string;
  /** Estimated hours. */
  est: number;
  /** Actual hours logged. */
  act: number;
  budget: number;
  spent: number;
  /** Human due date, e.g. "Aug 14" or "—". */
  due: string;
  health: ProjectHealth;
  /** Completion percent 0–100. */
  completion: number;
  /** Optional risk note surfaced on cards. */
  warn?: string;
  /** Team member initials. */
  team: string[];
}

/** A single time entry within a day. `p` indexes into the projects array. */
export interface TimeEntry {
  p: number;
  task: string;
  desc: string;
  start: string;
  end: string;
  brk: string;
  billable: boolean;
  hours: number | '';
}

export type EntriesByDay = Record<number, TimeEntry[]>;

export interface Task {
  id: number;
  label: string;
  p: number;
  done: boolean;
  due: string;
  urgent: boolean;
}

/** A project row in the weekly grid; `hours` has 7 cells (Mon–Sun). */
export interface WeekRow {
  p: number;
  task: string;
  hours: (number | '')[];
}

export type WeekStatus = 'Draft' | 'Pending' | 'Approved';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Approval {
  id: string;
  name: string;
  initials: string;
  dept: string;
  week: string;
  hours: number;
  /** Billable percent 0–100. */
  billable: number;
  status: ApprovalStatus;
  submitted: string;
  /** Optional flag note, e.g. "+2h overtime". */
  flag: string;
}
