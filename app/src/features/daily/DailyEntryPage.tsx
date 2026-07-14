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
import { projectsService, type Project } from '@/services/projectsService';
import { timeEntriesService, type TimeEntry } from '@/services/timesheetService';
import { useUiStore } from '@/store/useUiStore';
import styles from './DailyEntry.module.css';

const GRID = '220px 150px 1fr 78px 78px 66px 96px 70px 36px';
const HEADERS = ['PROJECT', 'TASK', 'DESCRIPTION', 'START', 'END', 'BREAK', 'BILLABLE', 'HOURS'];
const DAY_TARGET = 8;

const fmt = (n: number) => String(Number(n.toFixed(2)));

export default function DailyEntryPage() {
  const toast = useUiStore((s) => s.showToast);

  const [date, setDate] = useState(today());
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [dayTotals, setDayTotals] = useState<Record<string, number>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Totals per day so the day strip can show each day's hours.
      const totals: Record<string, number> = {};
      for (const e of weekEntries) totals[e.date] = (totals[e.date] ?? 0) + e.hours;
      setDayTotals(totals);
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

  const dayTotal = entries.reduce((t, e) => t + e.hours, 0);

  const addEntry = async () => {
    if (projects.length === 0) {
      toast('Create a project first — you need something to log time against.');
      return;
    }
    try {
      await timeEntriesService.create({
        projectId: projects[0].id,
        date,
        task: '',
        billable: true,
        hours: 0,
      });
      void load();
    } catch (err) {
      fail(err);
    }
  };

  /** Persist a single field edit on an entry. */
  const patch = async (entry: TimeEntry, changes: Partial<TimeEntry>) => {
    const merged = { ...entry, ...changes };
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? merged : e))); // optimistic
    try {
      await timeEntriesService.update(entry.id, {
        projectId: merged.projectId,
        date: merged.date,
        task: merged.task,
        description: merged.description,
        start: merged.start,
        end: merged.end,
        break: merged.break,
        billable: merged.billable,
        hours: Number(merged.hours) || 0,
      });
      void load();
    } catch (err) {
      fail(err);
      void load(); // roll back to server truth
    }
  };

  const removeEntry = async (id: string) => {
    try {
      await timeEntriesService.remove(id);
      void load();
    } catch (err) {
      fail(err);
    }
  };

  const duplicateYesterday = async () => {
    const from = iso(addDays(parseIso(date), -1));
    try {
      const { copied } = await timeEntriesService.duplicateDay(from, date);
      toast(copied > 0 ? `Copied ${copied} entries from yesterday` : 'Nothing to copy from yesterday');
      void load();
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
          <div className={styles.subtitle}>Log time against your projects</div>
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

      {/* DAY STRIP — real dates for the week containing the selected day */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginBottom: 14 }}>
        {days.map((d, i) => {
          const active = d === date;
          const tot = dayTotals[d] ?? 0;
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
                  color: active ? 'rgba(255,255,255,.72)' : tot > 0 ? 'var(--text3)' : 'var(--text3)',
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
          entries.map((e) => (
            <div
              key={e.id}
              className={styles.row}
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                alignItems: 'center',
                padding: '4px 12px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px' }}>
                <span
                  style={{ width: 9, height: 9, borderRadius: 3, background: e.projectColor, flexShrink: 0 }}
                />
                <select
                  className={styles.projectSelect}
                  value={e.projectId}
                  onChange={(ev) => patch(e, { projectId: ev.target.value })}
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
                defaultValue={e.task}
                onBlur={(ev) => ev.target.value !== e.task && patch(e, { task: ev.target.value })}
                placeholder="Task"
              />
              <input
                className={styles.cellInput}
                style={{ color: 'var(--text2)' }}
                defaultValue={e.description ?? ''}
                onBlur={(ev) =>
                  ev.target.value !== (e.description ?? '') && patch(e, { description: ev.target.value })
                }
                placeholder="What did you work on?"
              />
              <input
                className={styles.cellInput}
                defaultValue={e.start ?? ''}
                onBlur={(ev) => ev.target.value !== (e.start ?? '') && patch(e, { start: ev.target.value })}
                placeholder="—"
              />
              <input
                className={styles.cellInput}
                defaultValue={e.end ?? ''}
                onBlur={(ev) => ev.target.value !== (e.end ?? '') && patch(e, { end: ev.target.value })}
                placeholder="—"
              />
              <input
                className={styles.cellInput}
                defaultValue={e.break ?? ''}
                onBlur={(ev) => ev.target.value !== (e.break ?? '') && patch(e, { break: ev.target.value })}
                placeholder="—"
              />

              <div style={{ padding: '0 8px' }}>
                <span
                  onClick={() => patch(e, { billable: !e.billable })}
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
                defaultValue={e.hours}
                onBlur={(ev) => {
                  const v = Number(ev.target.value) || 0;
                  if (v !== e.hours) patch(e, { hours: v });
                }}
              />

              <div className={styles.iconAction} title="Remove entry" onClick={() => removeEntry(e.id)}>
                <Icon name="trash" size={12} />
              </div>
            </div>
          ))}

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
