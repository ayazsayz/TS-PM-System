/** Parsing helpers for the timesheet's free-form time fields. */

/**
 * A clock time → minutes since midnight.
 * Accepts "9", "9:30", "09:00", "0930". Returns null if unparseable.
 */
export function parseClock(value?: string | null): number | null {
  if (!value) return null;
  const s = value.trim();
  if (!s) return null;

  let hours: number;
  let minutes = 0;

  if (s.includes(':')) {
    const [h, m] = s.split(':');
    hours = Number(h);
    minutes = m ? Number(m) : 0;
  } else if (/^\d{3,4}$/.test(s)) {
    // "930" / "0930"
    hours = Number(s.slice(0, s.length - 2));
    minutes = Number(s.slice(-2));
  } else if (/^\d{1,2}$/.test(s)) {
    hours = Number(s);
  } else {
    return null;
  }

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * A duration (break) → minutes.
 * Accepts "0:30", "1:15", and bare numbers as MINUTES ("30" → 30 min).
 */
export function parseDuration(value?: string | null): number | null {
  if (!value) return null;
  const s = value.trim();
  if (!s) return null;

  if (s.includes(':')) {
    const [h, m] = s.split(':');
    const hours = Number(h || 0);
    const minutes = Number(m || 0);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return hours * 60 + minutes;
  }

  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Hours worked from start/end (minus an optional break).
 * Returns null when it can't be derived — the caller then leaves `hours` alone,
 * so a user who types hours directly is never overridden.
 */
export function computeHours(
  start?: string | null,
  end?: string | null,
  breakValue?: string | null,
): number | null {
  const s = parseClock(start);
  const e = parseClock(end);
  if (s === null || e === null) return null;
  if (e <= s) return null; // don't guess at typos or overnight shifts

  const worked = e - s - (parseDuration(breakValue) ?? 0);
  if (worked <= 0) return null;

  return Math.round((worked / 60) * 100) / 100;
}
