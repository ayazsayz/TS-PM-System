import type {
  Approval,
  EntriesByDay,
  Project,
  Task,
  WeekRow,
} from './types';

/**
 * Seed data — lifted from the ui-mockup's Component state so the React app
 * renders identical numbers. In a real deployment this comes from an API;
 * the store reads from here today and can swap to fetch() later.
 */

export const projects: Project[] = [
  { name: 'Aurora Cloud Migration', client: 'Nexbank', color: '#4757E6', est: 1200, act: 860, budget: 180000, spent: 122000, due: 'Aug 14', health: 'On track', completion: 72, team: ['SC', 'MW', 'AM'] },
  { name: 'Helios ERP Rollout', client: 'Vertex Retail', color: '#0E9384', est: 2400, act: 2310, budget: 310000, spent: 296000, due: 'Jul 31', health: 'At risk', completion: 88, warn: '96% of estimated hours consumed', team: ['PS', 'LF', 'TO', 'AM'] },
  { name: 'Atlas Mobile Banking', client: 'Nexbank', color: '#B54708', est: 900, act: 1010, budget: 140000, spent: 152000, due: 'Jul 10', health: 'Over budget', completion: 94, warn: 'Over budget · 110h over estimate', team: ['MW', 'DR'] },
  { name: 'Orion Data Platform', client: 'MedCore Health', color: '#7839EE', est: 1600, act: 610, budget: 220000, spent: 78000, due: 'Oct 2', health: 'On track', completion: 38, team: ['AM', 'PS', 'TO'] },
  { name: 'Zephyr Portal Redesign', client: 'GreenGrid Energy', color: '#C11574', est: 480, act: 495, budget: 64000, spent: 61000, due: 'Jul 8', health: 'Delayed', completion: 92, warn: 'Delayed · due in 5 days', team: ['DR', 'LF'] },
  { name: 'Titan DevOps Enablement', client: 'Vertex Retail', color: '#175CD3', est: 700, act: 698, budget: 95000, spent: 93000, due: 'Jun 20', health: 'Completed', completion: 100, team: ['SC', 'TO'] },
  { name: 'Internal · Training & Ops', client: 'eTech', color: '#667085', est: 0, act: 0, budget: 0, spent: 0, due: '—', health: 'On track', completion: 0, team: [] },
];

/** Avatar background per person initials. */
export const avatarColors: Record<string, string> = {
  SC: '#4757E6', MW: '#0E9384', PS: '#B54708', TO: '#175CD3',
  LF: '#C11574', DR: '#7839EE', AM: '#475467', AP: '#0E9384',
};

export const weekLabels = [
  'Jun 15 – 21, 2026',
  'Jun 22 – 28, 2026',
  'Jun 29 – Jul 5, 2026',
  'Jul 6 – 12, 2026',
];

export const dayLabels = [
  'Monday, Jun 29',
  'Tuesday, Jun 30',
  'Wednesday, Jul 1',
  'Thursday, Jul 2',
  'Friday, Jul 3',
  'Saturday, Jul 4',
  'Sunday, Jul 5',
];

/** [short name, day-of-month] for the daily-entry day strip. */
export const dayDefs: [string, string][] = [
  ['Mon', '29'], ['Tue', '30'], ['Wed', '1'], ['Thu', '2'],
  ['Fri', '3'], ['Sat', '4'], ['Sun', '5'],
];

export const entriesByDay: EntriesByDay = {
  0: [
    { p: 0, task: 'API integration', desc: 'Payment gateway endpoints + error handling', start: '09:00', end: '13:30', brk: '0:30', billable: true, hours: 4 },
    { p: 3, task: 'Architecture', desc: 'Entity model draft for claims domain', start: '13:30', end: '16:00', brk: '', billable: true, hours: 2.5 },
    { p: 1, task: 'Support', desc: 'Helios ticket triage — priority queue', start: '16:00', end: '17:30', brk: '', billable: true, hours: 1.5 },
  ],
  1: [
    { p: 0, task: 'Development', desc: 'Migration scripts for account service', start: '09:00', end: '12:30', brk: '', billable: true, hours: 3.5 },
    { p: 3, task: 'Workshops', desc: 'Data mapping workshop with MedCore', start: '13:00', end: '16:00', brk: '', billable: true, hours: 3 },
    { p: 6, task: 'Training', desc: 'Security awareness module', start: '16:00', end: '16:30', brk: '', billable: false, hours: 0.5 },
    { p: 1, task: 'Support', desc: 'Regression check on invoice batch', start: '16:30', end: '17:30', brk: '', billable: true, hours: 1 },
  ],
  2: [
    { p: 0, task: 'Development', desc: 'Auth flow refactor + code review', start: '09:00', end: '13:00', brk: '', billable: true, hours: 4 },
    { p: 3, task: 'Architecture', desc: 'Pipeline design doc v2', start: '13:30', end: '15:30', brk: '', billable: true, hours: 2 },
    { p: 1, task: 'Support', desc: 'Hotfix validation with Vertex team', start: '15:30', end: '17:30', brk: '', billable: true, hours: 2 },
  ],
  3: [
    { p: 0, task: 'Development', desc: 'Payment gateway sandbox testing', start: '09:00', end: '12:30', brk: '', billable: true, hours: 3.5 },
    { p: 3, task: 'Data model review', desc: 'Entity mapping session notes', start: '13:00', end: '15:30', brk: '', billable: true, hours: 2.5 },
    { p: 1, task: 'Support', desc: 'Monthly close support window', start: '15:30', end: '17:00', brk: '', billable: true, hours: 1.5 },
    { p: 6, task: 'Team sync', desc: 'Chapter meeting', start: '17:00', end: '17:30', brk: '', billable: false, hours: 0.5 },
  ],
  4: [
    { p: 0, task: 'API integration', desc: 'Payment gateway endpoints + error handling', start: '09:00', end: '12:30', brk: '0:30', billable: true, hours: 3 },
    { p: 0, task: 'Sprint planning', desc: 'Sprint 14 grooming with Nexbank team', start: '13:00', end: '14:00', brk: '', billable: true, hours: 1 },
    { p: 3, task: 'Data model review', desc: 'Entity mapping workshop follow-up', start: '14:00', end: '16:30', brk: '', billable: true, hours: 2.5 },
  ],
  5: [],
  6: [],
};

export const tasks: Task[] = [
  { id: 1, label: 'Finalize payment API error states', p: 0, done: false, due: 'Today', urgent: true },
  { id: 2, label: 'Prepare demo for Nexbank steering committee', p: 0, done: false, due: 'Mon', urgent: false },
  { id: 3, label: 'Review Orion entity mapping document', p: 3, done: false, due: 'Jul 8', urgent: false },
  { id: 4, label: 'Update Helios support runbook', p: 1, done: false, due: 'Jul 11', urgent: false },
  { id: 5, label: 'Submit June expense report', p: 6, done: true, due: 'Done', urgent: false },
];

export const weekRows: WeekRow[] = [
  { p: 0, task: 'Development', hours: [4, 3.5, 4, 3.5, 3.5, '', ''] },
  { p: 3, task: 'Architecture', hours: [2.5, 3, 2, 2.5, 2, '', ''] },
  { p: 1, task: 'Support', hours: [1.5, 1, 2, 1.5, 1, '', ''] },
  { p: 6, task: 'Training & internal', hours: ['', 0.5, '', 0.5, '', '', ''] },
];

export const approvals: Approval[] = [
  { id: 'a1', name: 'Sarah Chen', initials: 'SC', dept: 'Engineering', week: 'Jun 22 – 28', hours: 40, billable: 92, status: 'Pending', submitted: 'Mon 9:12 AM', flag: '' },
  { id: 'a2', name: 'Marcus Webb', initials: 'MW', dept: 'Engineering', week: 'Jun 22 – 28', hours: 38.5, billable: 84, status: 'Pending', submitted: 'Mon 11:40 AM', flag: '1.5h under' },
  { id: 'a3', name: 'Priya Sharma', initials: 'PS', dept: 'Data', week: 'Jun 22 – 28', hours: 42, billable: 95, status: 'Pending', submitted: 'Sun 8:05 PM', flag: '+2h overtime' },
  { id: 'a4', name: 'Diego Ruiz', initials: 'DR', dept: 'Design', week: 'Jun 22 – 28', hours: 40, billable: 76, status: 'Pending', submitted: 'Mon 8:30 AM', flag: '' },
  { id: 'a5', name: 'Lena Fischer', initials: 'LF', dept: 'Engineering', week: 'Jun 22 – 28', hours: 40, billable: 88, status: 'Approved', submitted: 'Fri 5:55 PM', flag: '' },
  { id: 'a6', name: 'Tom Okafor', initials: 'TO', dept: 'Data', week: 'Jun 15 – 21', hours: 35, billable: 71, status: 'Rejected', submitted: 'Tue 10:15 AM', flag: '5h missing' },
];

/** Active-day index the mockup opens on (Friday). */
export const initialActiveDay = 4;
/** Week index the weekly grid opens on. */
export const initialWeekIdx = 2;
