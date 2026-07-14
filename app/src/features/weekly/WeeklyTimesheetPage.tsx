import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Icon, PageContainer, ProgressBar, type Tone } from '@/components';
import { ApiError } from '@/lib/apiClient';
import { DAY_NAMES, addDays, dayOfMonth, iso, parseIso, today, weekDates, weekLabel } from '@/lib/dates';
import { projectsService, type Project } from '@/services/projectsService';
import { timesheetsService, type TimesheetStatus, type WeeklyTimesheet } from '@/services/timesheetService';
import { useUiStore } from '@/store/useUiStore';
import styles from './Weekly.module.css';

const GRID = 'minmax(230px,1.4fr) repeat(7,minmax(64px,1fr)) 84px 36px';
const WEEK_TARGET = 40;

const statusTone: Record<TimesheetStatus, Tone> = {
  Draft: 'neutral',
  Pending: 'amber',
  Approved: 'green',
  Rejected: 'red',
};

const fmt = (n: number) => String(Number(n.toFixed(2)));

/** A row the user added locally that has no hours yet (so no server rows exist). */
interface DraftRow {
  projectId: string;
  task: string;
}

export default function WeeklyTimesheetPage() {
  const toast = useUiStore((s) => s.showToast);

  const [weekStart, setWeekStart] = useState(weekDates(today())[0]);
  const [sheet, setSheet] = useState<WeeklyTimesheet | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days = weekDates(weekStart);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, p] = await Promise.all([timesheetsService.week(weekStart), projectsService.list()]);
      setSheet(w);
      setProjects(p);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the timesheet.');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    void load();
    setDrafts([]);
  }, [load]);

  const fail = (err: unknown) =>
    toast(err instanceof ApiError ? err.message : 'Something went wrong.');

  const setCell = async (projectId: string, task: string, dayIndex: number, value: string) => {
    const hours = Number(value) || 0;
    try {
      const updated = await timesheetsService.setCell(weekStart, {
        projectId,
        task,
        date: days[dayIndex],
        hours,
      });
      setSheet(updated);
      // Once a draft row has real hours the server returns it; drop the local placeholder.
      if (hours > 0) setDrafts((d) => d.filter((r) => !(r.projectId === projectId && r.task === task)));
    } catch (err) {
      fail(err);
    }
  };

  const submit = async () => {
    try {
      const updated = await timesheetsService.submit(weekStart);
      setSheet(updated);
      toast('Timesheet submitted — pending approval');
    } catch (err) {
      fail(err);
    }
  };

  const shiftWeek = (delta: number) =>
    setWeekStart(iso(addDays(parseIso(weekStart), delta * 7)));

  const addRow = () => {
    if (projects.length === 0) {
      toast('Create a project first — you need something to log time against.');
      return;
    }
    setDrafts((d) => [...d, { projectId: projects[0].id, task: '' }]);
  };

  const status = sheet?.status ?? 'Draft';
  const isDraft = status === 'Draft';
  const submitLabel = isDraft
    ? 'Submit for approval'
    : status === 'Pending'
      ? 'Submitted · awaiting review'
      : status;

  // Server rows plus any local draft rows not yet backed by entries.
  const serverRows = sheet?.rows ?? [];
  const rows = [
    ...serverRows,
    ...drafts
      .filter((d) => !serverRows.some((r) => r.projectId === d.projectId && r.task === d.task))
      .map((d) => {
        const p = projects.find((x) => x.id === d.projectId);
        return {
          projectId: d.projectId,
          projectName: p?.name ?? '',
          client: p?.client ?? '',
          colorHex: p?.colorHex ?? '#475467',
          task: d.task,
          cells: [0, 0, 0, 0, 0, 0, 0],
          total: 0,
          isDraft: true as const,
        };
      }),
  ];

  const dayTotals = sheet?.dayTotals ?? [0, 0, 0, 0, 0, 0, 0];
  const total = sheet?.totalHours ?? 0;

  return (
    <PageContainer>
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 className={styles.title}>Week of {weekLabel(weekStart)}</h1>
            <Badge tone={statusTone[status]}>{status}</Badge>
          </div>
          <div className={styles.subtitle}>Standard week = {WEEK_TARGET}h</div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid var(--border2)', borderRadius: 9, overflow: 'hidden' }}>
            <div className={styles.navBtn} onClick={() => shiftWeek(-1)}>
              ‹
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div className={styles.navBtn} onClick={() => shiftWeek(1)}>
              ›
            </div>
          </div>
          <Button variant="secondary" onClick={() => setWeekStart(weekDates(today())[0])}>
            This week
          </Button>
          <button
            onClick={submit}
            disabled={!isDraft || total === 0}
            style={{
              padding: '9px 16px',
              borderRadius: 9,
              border: 'none',
              background: isDraft && total > 0 ? 'var(--accent)' : 'var(--surface2)',
              color: isDraft && total > 0 ? '#fff' : 'var(--text3)',
              fontSize: 13,
              fontWeight: 600,
              cursor: isDraft && total > 0 ? 'pointer' : 'default',
            }}
          >
            {submitLabel}
          </button>
        </div>
      </div>

      {/* PROGRESS */}
      <Card pad={false} style={{ padding: '16px 20px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="tnum" style={{ fontSize: 13, fontWeight: 650 }}>
            {fmt(total)} / {WEEK_TARGET}h · {sheet?.weekPercent ?? 0}%
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--text3)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text2)' }}>
              {fmt(sheet?.remaining ?? WEEK_TARGET)}h
            </span>{' '}
            to complete the week
          </span>
        </div>
        <ProgressBar value={Math.min(100, (total / WEEK_TARGET) * 100)} />
      </Card>

      {/* GRID */}
      <Card pad={false} style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            background: 'var(--surface2)',
            borderBottom: '1px solid var(--border)',
            padding: '0 12px',
          }}
        >
          <div className={styles.colHead}>PROJECT / TASK</div>
          {days.map((d, i) => {
            const isToday = d === today();
            const weekend = i >= 5;
            return (
              <div
                key={d}
                className={styles.colHead}
                style={{
                  padding: '11px 6px',
                  textAlign: 'center',
                  color: isToday ? 'var(--accent-text)' : 'var(--text3)',
                  opacity: weekend ? 0.6 : 1,
                }}
              >
                {DAY_NAMES[i]}
                <br />
                <span style={{ fontWeight: 600 }}>{dayOfMonth(d)}</span>
              </div>
            );
          })}
          <div className={styles.colHead} style={{ textAlign: 'right' }}>
            TOTAL
          </div>
          <div />
        </div>

        {loading && <div className={styles.empty}>Loading…</div>}

        {!loading && error && (
          <div className={styles.empty} style={{ color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div style={{ padding: '44px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>
              Nothing logged this week
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text3)', marginBottom: 16 }}>
              {projects.length === 0
                ? 'You have no projects yet — create one before logging time.'
                : 'Add a project row and fill in your hours.'}
            </div>
            {projects.length > 0 && (
              <Button variant="secondary" onClick={addRow}>
                + Add project row
              </Button>
            )}
          </div>
        )}

        {!loading &&
          !error &&
          rows.map((r, ri) => (
            <div
              key={`${r.projectId}|${r.task}|${ri}`}
              className={styles.row}
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                alignItems: 'center',
                borderBottom: '1px solid var(--border)',
                padding: '4px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 8, minWidth: 0 }}>
                <span
                  style={{ width: 9, height: 9, borderRadius: 3, background: r.colorHex, flexShrink: 0 }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  {'isDraft' in r ? (
                    // Draft rows let you pick the project + task before any hours exist.
                    <>
                      <select
                        value={r.projectId}
                        onChange={(e) =>
                          setDrafts((d) =>
                            d.map((x, i) =>
                              i === ri - serverRows.length ? { ...x, projectId: e.target.value } : x,
                            ),
                          )
                        }
                        className={styles.draftSelect}
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <input
                        placeholder="Task"
                        defaultValue={r.task}
                        onBlur={(e) =>
                          setDrafts((d) =>
                            d.map((x, i) =>
                              i === ri - serverRows.length ? { ...x, task: e.target.value } : x,
                            ),
                          )
                        }
                        className={styles.draftInput}
                      />
                    </>
                  ) : (
                    <>
                      <div className={styles.rowName}>{r.projectName}</div>
                      <div className={styles.rowMeta}>
                        {r.client}
                        {r.task ? ` · ${r.task}` : ''}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {r.cells.map((h, ci) => (
                <div key={ci} style={{ padding: 3, background: ci >= 5 ? 'var(--surface2)' : 'transparent' }}>
                  <input
                    className={styles.cell}
                    type="number"
                    step="0.5"
                    min="0"
                    defaultValue={h || ''}
                    disabled={!isDraft}
                    onBlur={(e) => {
                      const v = Number(e.target.value) || 0;
                      if (v !== h) void setCell(r.projectId, r.task, ci, e.target.value);
                    }}
                    placeholder="·"
                  />
                </div>
              ))}

              <div className="tnum" style={{ fontSize: 13.5, fontWeight: 700, textAlign: 'right', padding: '0 8px' }}>
                {fmt(r.total)}
              </div>
              <div />
            </div>
          ))}

        {!loading && !error && rows.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              alignItems: 'center',
              background: 'var(--surface2)',
              padding: '4px 12px',
            }}
          >
            <button
              onClick={addRow}
              disabled={!isDraft}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: 13,
                fontWeight: 600,
                color: isDraft ? 'var(--accent-text)' : 'var(--text3)',
                cursor: isDraft ? 'pointer' : 'default',
                textAlign: 'left',
                padding: '10px 8px',
              }}
            >
              + Add project row
            </button>
            {dayTotals.map((t, i) => (
              <div
                key={i}
                className="tnum"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  textAlign: 'center',
                  color: t >= 8 ? 'var(--green)' : t > 0 ? 'var(--text)' : 'var(--text3)',
                  padding: '10px 4px',
                }}
              >
                {t ? fmt(t) : '—'}
              </div>
            ))}
            <div
              className="tnum"
              style={{ fontSize: 14.5, fontWeight: 700, textAlign: 'right', padding: '0 8px', color: 'var(--accent-text)' }}
            >
              {fmt(total)}h
            </div>
            <div />
          </div>
        )}
      </Card>

      {!isDraft && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Icon name="check-circle" size={13} />
          This week has been submitted and is locked. Cells are read-only.
        </div>
      )}
    </PageContainer>
  );
}
