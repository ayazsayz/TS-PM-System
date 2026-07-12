import { Button, Card, Icon, PageContainer, ProgressBar } from '@/components';
import { dayDefs, dayLabels, projects } from '@/lib/mockData';
import { DAY_HOURS, dayBarColor, fmtH, pct, sumEntries } from '@/lib/calc';
import { useTimesheetStore } from '@/store/useTimesheetStore';
import { useUiStore } from '@/store/useUiStore';
import styles from './DailyEntry.module.css';

const GRID = '220px 150px 1fr 78px 78px 66px 96px 70px 36px';
const HEADERS = ['PROJECT', 'TASK', 'DESCRIPTION', 'START', 'END', 'BREAK', 'BILLABLE', 'HOURS'];

/** Favorite projects for the quick-add row. */
const favIdx = [0, 3, 1, 6];

export default function DailyEntryPage() {
  const {
    activeDay,
    entriesByDay,
    setActiveDay,
    updateEntry,
    addEntry,
    removeEntry,
    duplicateYesterday,
  } = useTimesheetStore();
  const toast = useUiStore((s) => s.showToast);

  const entries = entriesByDay[activeDay] || [];
  const dayTotal = sumEntries(entries);

  const remainLabel =
    dayTotal > DAY_HOURS
      ? `${fmtH(dayTotal - DAY_HOURS)}h over standard day`
      : dayTotal >= DAY_HOURS
        ? 'Day complete ✓'
        : `${fmtH(DAY_HOURS - dayTotal)}h remaining`;
  const remainColor =
    dayTotal > DAY_HOURS ? 'var(--amber)' : dayTotal >= DAY_HOURS ? 'var(--green)' : 'var(--text3)';

  return (
    <PageContainer>
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {dayLabels[activeDay]}
          </h1>
          <div style={{ fontSize: 13.5, color: 'var(--text3)' }}>
            Week 27 · Auto-save on · <span style={{ color: 'var(--text2)' }}>Tab / Enter to move between cells</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={duplicateYesterday}>
            <Icon name="copy" size={13} />
            Duplicate yesterday
          </Button>
          <Button variant="secondary" onClick={() => toast('Draft saved · auto-save is on')}>
            Save draft
          </Button>
          <Button variant="primary" onClick={() => toast('Day submitted for approval')}>
            Submit day
          </Button>
        </div>
      </div>

      {/* DAY STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginBottom: 14 }}>
        {dayDefs.map(([name, num], i) => {
          const tot = sumEntries(entriesByDay[i] || []);
          const active = i === activeDay;
          const subLabel = tot > 0 ? `${fmtH(tot)}h` : i >= 5 ? '—' : '0h';
          const dotBg = active
            ? 'rgba(255,255,255,.72)'
            : tot >= DAY_HOURS
              ? 'var(--green)'
              : tot > 0
                ? 'var(--amber)'
                : 'var(--border2)';
          const subColor = active ? 'rgba(255,255,255,.72)' : tot >= DAY_HOURS ? 'var(--green)' : 'var(--text3)';
          return (
            <div
              key={name}
              className={styles.dayCell}
              onClick={() => setActiveDay(i)}
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
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', opacity: 0.75 }}>{name}</div>
              <div className="tnum" style={{ fontSize: 17, fontWeight: 700 }}>
                {num}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: subColor }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: dotBg }} />
                {subLabel}
              </div>
            </div>
          );
        })}
      </div>

      {/* PROGRESS */}
      <Card pad={false} style={{ padding: '16px 20px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="tnum" style={{ fontSize: 13, fontWeight: 650 }}>
            {fmtH(dayTotal)} / {DAY_HOURS}h logged
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: remainColor }}>{remainLabel}</span>
        </div>
        <ProgressBar value={pct(dayTotal, DAY_HOURS)} color={dayBarColor(dayTotal)} />
      </Card>

      {/* ENTRY GRID */}
      <Card pad={false} style={{ overflow: 'hidden', marginBottom: 14 }}>
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

        {entries.length === 0 ? (
          <div style={{ padding: '44px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>
              No time logged for this day
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text3)', marginBottom: 16 }}>
              Add an entry, or copy yesterday's schedule to get started.
            </div>
            <button
              onClick={() => addEntry(0)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--border2)',
                background: 'var(--surface)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                color: 'var(--accent-text)',
              }}
            >
              + Add first entry
            </button>
          </div>
        ) : (
          <>
            {entries.map((e, i) => (
              <div
                key={i}
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
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: projects[e.p].color, flexShrink: 0 }} />
                  <select
                    className={styles.projectSelect}
                    value={e.p}
                    onChange={(ev) => updateEntry(i, 'p', parseInt(ev.target.value, 10))}
                  >
                    {projects.map((p, idx) => (
                      <option key={idx} value={idx}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  className={styles.cellInput}
                  value={e.task}
                  onChange={(ev) => updateEntry(i, 'task', ev.target.value)}
                  placeholder="Task"
                />
                <input
                  className={styles.cellInput}
                  style={{ color: 'var(--text2)' }}
                  value={e.desc}
                  onChange={(ev) => updateEntry(i, 'desc', ev.target.value)}
                  placeholder="What did you work on?"
                />
                <input
                  className={styles.cellInput}
                  value={e.start}
                  onChange={(ev) => updateEntry(i, 'start', ev.target.value)}
                  placeholder="—"
                />
                <input
                  className={styles.cellInput}
                  value={e.end}
                  onChange={(ev) => updateEntry(i, 'end', ev.target.value)}
                  placeholder="—"
                />
                <input
                  className={styles.cellInput}
                  value={e.brk}
                  onChange={(ev) => updateEntry(i, 'brk', ev.target.value)}
                  placeholder="—"
                />
                <div style={{ padding: '0 8px' }}>
                  <span
                    onClick={() => updateEntry(i, 'billable', !e.billable)}
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
                  onChange={(ev) => updateEntry(i, 'hours', ev.target.value === '' ? '' : parseFloat(ev.target.value))}
                  placeholder="0"
                />
                <div className={styles.iconAction} title="Remove entry" onClick={() => removeEntry(i)}>
                  <Icon name="trash" size={12} />
                </div>
              </div>
            ))}
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
                onClick={() => addEntry(0)}
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
                  {fmtH(dayTotal)}h
                </span>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* QUICK ADD */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text3)' }}>Quick add from favorites:</span>
        {favIdx.map((idx) => {
          const p = projects[idx];
          const shortName = p.name.split('·')[0].trim();
          return (
            <span
              key={idx}
              onClick={() => {
                addEntry(idx);
                toast(`Entry added — ${p.name}`);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--text2)',
                background: 'var(--surface)',
                border: '1px solid var(--border2)',
                borderRadius: 99,
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 99, background: p.color }} />
              {shortName}
            </span>
          );
        })}
      </div>
    </PageContainer>
  );
}
