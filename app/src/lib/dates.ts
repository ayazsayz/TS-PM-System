/** Date helpers for the timesheet grids (all ISO `yyyy-MM-dd`, Monday-first weeks). */

export const iso = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parseIso = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const today = (): string => iso(new Date());

/** Monday of the week containing `d`. */
export const weekMonday = (d: Date): Date => {
  const copy = new Date(d);
  const diff = (copy.getDay() + 6) % 7; // Monday = 0
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const addDays = (d: Date, n: number): Date => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
};

/** The 7 ISO dates of the week containing `dateIso`. */
export const weekDates = (dateIso: string): string[] => {
  const monday = weekMonday(parseIso(dateIso));
  return Array.from({ length: 7 }, (_, i) => iso(addDays(monday, i)));
};

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** e.g. "Friday, Jul 3" */
export const longDay = (dateIso: string): string =>
  parseIso(dateIso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

/** e.g. "Jun 29 – Jul 5, 2026" */
export const weekLabel = (weekStartIso: string): string => {
  const start = parseIso(weekStartIso);
  const end = addDays(start, 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString(undefined, opts);
  const endStr =
    start.getMonth() === end.getMonth()
      ? String(end.getDate())
      : end.toLocaleDateString(undefined, opts);
  return `${startStr} – ${endStr}, ${end.getFullYear()}`;
};

export const dayOfMonth = (dateIso: string): string => String(parseIso(dateIso).getDate());
