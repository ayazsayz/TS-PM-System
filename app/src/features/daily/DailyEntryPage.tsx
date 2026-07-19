import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Icon, PageContainer, ProgressBar } from '@/components';
import { ApiError } from '@/lib/apiClient';
import {
  DAY_NAMES,
  addDays,
  dayOfMonth,
  iso,
  longDay,
  parseIso,
  today,
  weekDates,
} from '@/lib/dates';
import { computeHours } from '@/lib/time';
import { attendanceService, formatMinutes } from '@/services/attendanceService';
import { projectsService, type Project } from '@/services/projectsService';
import { timeEntriesService, type TimeEntry } from '@/services/timesheetService';
import { useUiStore } from '@/store/useUiStore';
import styles from './DailyEntry.module.css';

const GRID = '220px 150px 1fr 78px 78px 66px 96px 70px 36px';
const HEADERS = ['PROJECT', 'TASK', 'DESCRIPTION', 'START', 'END', 'BREAK', 'BILLABLE', 'HOURS'];
const DAY_TARGET = 8;

const fmt = (n: number) => String(Number(n.toFixed(2)));

/** Fields the user can edit inline. */
type EditableField = 'projectId' | 'task' | 'description' | 'start' | 'end' | 'break' | 'billable' | 'hours';

export default function DailyEntryPage() {
  const toast = useUiStore((s) => s.showToast);

  const [date, setDate] = useState(today());
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [weekTotals, setWeekTotals] = useState<Record<string, number>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Ids currently being saved — drives the subtle row "saving" hint. */
  const [saving, setSaving] = useState<Set<string>>(new Set());
  /** Minutes present (from attendance) for the selected day — shown as a hint only. */
  const [presentMinutes, setPresentMinutes] = useState<number | null>(null);

  const days = weekDates(date);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const weekStart = weekDates(date)[0];
      const [dayEntries, weekEntries, projs] = await Promise.all([
        timeEntriesService.byDate(date),
        timeEntriesService.byWeek(weekStart),
        projectsService.list(),
      ]);
      setEntries(dayEntries);
      setProjects(projs);

      const totals: Record<string, number> = {};
      for (const e of weekEntries) totals[e.date] = (totals[e.date] ?? 0) + e.hours;
      setWeekTotals(totals);

      // Attendance is a hint here, never a requirement — failures are non-fatal.
      try {
        const day = await attendanceService.today(date);
        setPresentMinutes(day.totalMinutes);
      } catch {
        setPresentMinutes(null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load entries.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const fail = (err: unknown) =>
    toast(err instanceof ApiError ? err.message : 'Something went wrong.');

  const dayTotal = entries.reduce((t, e) => t + (Number(e.hours) || 0), 0);

  /** Local-only edit — keeps typing smooth, no network, no re-render of the grid. */
  const editLocal = (id: string, field: EditableField, value: unknown) =>
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const next = { ...e, [field]: value } as TimeEntry;

        // Auto-calculate hours from start/end (minus break) when both are present.
        // If they can't be derived, `hours` is left exactly as the user typed it.
        if (field === 'start' || field === 'end' || field === 'break') {
          const computed = computeHours(next.start, next.end, next.break);
          if (computed !== null) next.hours = computed;
        }
        return next;
      }),
    );

  /**
   * Persist one entry. Updates only that row from the server response —
   * deliberately does NOT call load(), which used to blank the whole grid
   * on every keystroke-commit.
   */
  const save = async (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;

    setSaving((s) => new Set(s).add(id));
    try {
      const saved = await timeEntriesService.update(id, {
        projectId: entry.projectId,
        date: entry.date,
        task: entry.task,
        description: entry.description,
        start: entry.start,
        end: entry.end,
        break: entry.break,
        billable: entry.billable,
        hours: Number(entry.hours) || 0,
      });
      setEntries((prev) => prev.map((e) => (e.id === id ? saved : e)));
    } catch (err) {
      fail(err);
      void load(); // fall back to server truth
    } finally {
      setSaving((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  const addEntry = async () => {
    if (projects.length === 0) {
      toast('Create a project first — you need something to log time against.');
      return;
    }
    try {
      const created = await timeEntriesService.create({
        projectId: projects[0].id,
        date,
        task: '',
        billable: true,
        hours: 0,
      });
      setEntries((prev) => [...prev, created]);
    } catch (err) {
      fail(err);
    }
  };

  const removeEntry = async (id: string) => {
    const prev = entries;
    setEntries((e) => e.filter((x) => x.id !== id)); // optimistic
    try {
      await timeEntriesService.remove(id);
    } catch (err) {
      fail(err);
      setEntries(prev);
    }
  };

  const duplicateYesterday = async () => {
    const from = iso(addDays(parseIso(date), -1));
    try {
      const { copied } = await timeEntriesService.duplicateDay(from, date);
      toast(copied > 0 ? `Copied ${copied} entries from yesterday` : 'Nothing to copy from yesterday');
      if (copied > 0) void load();
    } catch (err) {
      fail(err);
    }
  };

  const remainLabel =
    dayTotal > DAY_TARGET
      ? `${fmt(dayTotal - DAY_TARGET)}h over standard day`
      : dayTotal >= DAY_TARGET
        ? 'Day complete ✓'
        : `${fmt(DAY_TARGET - dayTotal)}h remaining`;
  const remainColor =
    dayTotal > DAY_TARGET ? 'var(--amber)' : dayTotal >= DAY_TARGET ? 'var(--green)' : 'var(--text3)';
  const barColor =
    dayTotal > DAY_TARGET ? 'var(--amber)' : dayTotal >= DAY_TARGET ? 'var(--green)' : 'var(--accent)';

  return (
    <PageContainer>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{longDay(date)}</h1>
          <div className={styles.subtitle}>
            Enter hours directly, or fill in start &amp; end and they’re calculated for you.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={duplicateYesterday}>
            <Icon name="copy" size={13} />
            Duplicate yesterday
          </Button>
          <Button variant="primary" onClick={addEntry}>
            <Icon name="plus" size={13} />
            Add entry
          </Button>
        </div>
      </div>

      {/* DAY STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginBottom: 14 }}>
        {days.map((d, i) => {
          const active = d === date;
          // The selected day's total comes from live local state so it updates as you type.
          const tot = active ? dayTotal : (weekTotals[d] ?? 0);
          const dot = active
            ? 'rgba(255,255,255,.72)'
            : tot >= DAY_TARGET
              ? 'var(--green)'
              : tot > 0
                ? 'var(--amber)'
                : 'var(--border2)';
          return (
            <div
              key={d}
              className={styles.dayCell}
              onClick={() => setDate(d)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '10px 4px',
                borderRadius: 10,
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'var(--accent)' : 'var(--surface)',
                color: active ? '#fff' : 'var(--text)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', opacity: 0.75 }}>
                {DAY_NAMES[i]}
              </div>
              <div className="tnum" style={{ fontSize: 17, fontWeight: 700 }}>
                {dayOfMonth(d)}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  color: active ? 'rgba(255,255,255,.72)' : 'var(--text3)',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 99, background: dot }} />
                {tot > 0 ? `${fmt(tot)}h` : '0h'}
              </div>
            </div>
          );
        })}
      </div>

      {/* PROGRESS */}
      <Card pad={false} style={{ padding: '16px 20px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="tnum" style={{ fontSize: 13, fontWeight: 650 }}>
            {fmt(dayTotal)} / {DAY_TARGET}h logged
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: remainColor }}>{remainLabel}</span>
        </div>
        <ProgressBar value={Math.min(100, (dayTotal / DAY_TARGET) * 100)} color={barColor} />

        {/* Attendance vs logged time — informational, never enforced. */}
        {presentMinutes !== null && presentMinutes > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              marginTop: 10,
              fontSize: 12,
              color: 'var(--text3)',
            }}
          >
            <Icon name="clock" size={12} />
            <span>
              Present <strong style={{ color: 'var(--text2)' }}>{formatMinutes(presentMinutes)}</strong> ·
              logged <strong style={{ color: 'var(--text2)' }}>{fmt(dayTotal)}h</strong>
              {(() => {
                const gap = presentMinutes - Math.round(dayTotal * 60);
                return gap >= 15 ? ` · ${formatMinutes(gap)} unaccounted` : '';
              })()}
            </span>
          </div>
        )}
      </Card>

      {/* ENTRY GRID */}
      <Card pad={false} style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            padding: '0 12px',
            background: 'var(--surface2)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {HEADERS.map((h, i) => (
            <div
              key={h}
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--text3)',
                padding: '10px 8px',
                textAlign: i === 7 ? 'right' : 'left',
              }}
            >
              {h}
            </div>
          ))}
          <div />
        </div>

        {loading && <div className={styles.empty}>Loading…</div>}

        {!loading && error && (
          <div className={styles.empty} style={{ color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div style={{ padding: '44px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>
              No time logged for this day
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text3)', marginBottom: 16 }}>
              {projects.length === 0
                ? 'You have no projects yet — create one before logging time.'
                : 'Add an entry, or copy yesterday’s schedule to get started.'}
            </div>
            {projects.length > 0 && (
              <Button variant="secondary" onClick={addEntry}>
                + Add first entry
              </Button>
            )}
          </div>
        )}

        {!loading &&
          !error &&
          entries.map((e) => {
            const auto = computeHours(e.start, e.end, e.break) !== null;
            return (
              <div
                key={e.id}
                className={styles.row}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  alignItems: 'center',
                  padding: '4px 12px',
                  borderBottom: '1px solid var(--border)',
                  opacity: saving.has(e.id) ? 0.65 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
                  <span
                    style={{ width: 9, height: 9, borderRadius: 3, background: e.projectColor, flexShrink: 0 }}
                  />
                  <select
                    className={styles.projectSelect}
                    value={e.projectId}
                    onChange={(ev) => {
                      editLocal(e.id, 'projectId', ev.target.value);
                      // selects have no "commit" moment — save immediately
                      setTimeout(() => void save(e.id), 0);
                    }}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  className={styles.cellInput}
                  value={e.task}
                  onChange={(ev) => editLocal(e.id, 'task', ev.target.value)}
                  onBlur={() => void save(e.id)}
                  placeholder="Task"
                />
                <input
                  className={styles.cellInput}
                  style={{ color: 'var(--text2)' }}
                  value={e.description ?? ''}
                  onChange={(ev) => editLocal(e.id, 'description', ev.target.value)}
                  onBlur={() => void save(e.id)}
                  placeholder="What did you work on?"
                />
                <input
                  className={styles.cellInput}
                  value={e.start ?? ''}
                  onChange={(ev) => editLocal(e.id, 'start', ev.target.value)}
                  onBlur={() => void save(e.id)}
                  placeholder="09:00"
                />
                <input
                  className={styles.cellInput}
                  value={e.end ?? ''}
                  onChange={(ev) => editLocal(e.id, 'end', ev.target.value)}
                  onBlur={() => void save(e.id)}
                  placeholder="17:00"
                />
                <input
                  className={styles.cellInput}
                  value={e.break ?? ''}
                  onChange={(ev) => editLocal(e.id, 'break', ev.target.value)}
                  onBlur={() => void save(e.id)}
                  placeholder="0:30"
                  title="Break — e.g. 0:30 or 30 (minutes)"
                />

                <div style={{ padding: '0 8px' }}>
                  <span
                    onClick={() => {
                      editLocal(e.id, 'billable', !e.billable);
                      setTimeout(() => void save(e.id), 0);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: e.billable ? 'var(--green)' : 'var(--text3)',
                      background: e.billable ? 'var(--green-soft)' : 'var(--surface2)',
                      borderRadius: 99,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {e.billable ? 'Billable' : 'Non-bill.'}
                  </span>
                </div>

                <input
                  className={styles.hoursInput}
                  type="number"
                  step="0.25"
                  min="0"
                  value={e.hours}
                  onChange={(ev) => editLocal(e.id, 'hours', ev.target.value === '' ? 0 : Number(ev.target.value))}
                  onBlur={() => void save(e.id)}
                  title={auto ? 'Calculated from start/end — you can still override it' : 'Hours'}
                  style={auto ? { borderColor: 'var(--accent)' } : undefined}
                />

                <div className={styles.iconAction} title="Remove entry" onClick={() => removeEntry(e.id)}>
                  <Icon name="trash" size={12} />
                </div>
              </div>
            );
          })}

        {!loading && !error && entries.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 20px',
              background: 'var(--surface2)',
            }}
          >
            <button
              onClick={addEntry}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--accent-text)',
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              + Add entry
            </button>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              Day total&nbsp;&nbsp;
              <span className="tnum" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                {fmt(dayTotal)}h
              </span>
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
