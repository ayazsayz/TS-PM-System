import type { IconName } from '@/components';

export interface NavItem {
  /** Route path segment under the app shell. */
  path: string;
  label: string;
  icon: IconName;
  /** Screen title shown in the topbar. */
  title: string;
  /** Show the pending-approvals badge on this item. */
  badge?: boolean;
}

export interface NavSection {
  heading: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    heading: 'MY WORK',
    items: [
      { path: 'dashboard', label: 'Dashboard', icon: 'dashboard', title: 'Dashboard' },
      { path: 'daily', label: 'Daily Entry', icon: 'clock', title: 'Daily Timesheet' },
      { path: 'weekly', label: 'Weekly Timesheet', icon: 'calendar', title: 'Weekly Timesheet' },
    ],
  },
  {
    heading: 'MANAGEMENT',
    items: [
      { path: 'team', label: 'Team Overview', icon: 'team', title: 'Team Overview' },
      { path: 'approvals', label: 'Approvals', icon: 'check-circle', title: 'Approvals', badge: true },
      { path: 'projects', label: 'Projects', icon: 'folder', title: 'Projects' },
      { path: 'reports', label: 'Reports', icon: 'bars', title: 'Reports' },
    ],
  },
];

/** Flat lookup of path → title for the topbar. */
export const titleByPath: Record<string, string> = Object.fromEntries(
  navSections.flatMap((s) => s.items.map((i) => [i.path, i.title])),
);
