import { Badge, Card, Icon, PageContainer, ProgressBar } from '@/components';
import { projects, weekLabels } from '@/lib/mockData';
import { WEEK_HOURS, fmtH, pct, sumCells, weekStatusTone } from '@/lib/calc';
import { useTimesheetStore } from '@/store/useTimesheetStore';
import { useUiStore } from '@/store/useUiStore';
import styles from './Weekly.module.css';

const GRID = 'minmax(230px,1.4fr) repeat(7,minmax(64px,1fr)) 84px 36px';

/** Fixed day-column headers (label, day-of-month, weekend?, today?). */
const dayCols: [string, string, boolean, boolean][] = [
  ['MON', '29', false, false],
  ['TUE', '30', false, false],
  ['WED', '1', false, false],
  ['THU', '2', false, false],
  ['FRI', '3', false, true],
  ['SAT', '4', true, false],
  ['SUN', '5', true, false],
];

export default function WeeklyTimesheetPage() {
  const {
    weekRows,
    weekIdx,
    weekStatus,
    setCell,
    addWeekRow,
    removeWeekRow,
    prevWeek,
    nextWeek,
    submitWeek,
  } = useTimesheetStore();
  const toast = useUiStore((s) => s.showToast);

  const rowSums = weekRows.map((r) => sumCells(r.hours));
  const dayTotals = [0, 1, 2, 3, 4, 5, 6].map((ci) =>
    weekRows.reduce((t, r) => t + (parseFloat(String(r.hours[ci])) || 0), 0),
  );
  const weekTotal = dayTotals.reduce((a, b) => a + b, 0);
  const weekPctVal = Math.round(pct(weekTotal, WEEK_HOURS));
  const weekRemaining = Math.max(0, WEEK_HOURS - weekTotal);

  const isDraft = weekStatus === 'Draft';
  const submitLabel = isDraft
    ? 'Submit for approval'
    : weekStatus === 'Pending'
      ? 'Submitted · awaiting review'
      : 'Approved';

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ margin: 0, fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>
              Week of {weekLabels[weekIdx]}
            </h1>
            <Badge tone={weekStatusTone(weekStatus)}>{weekStatus}</Badge>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text3)' }}>Approver: Dana Whitfield · Due Friday 6 PM</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid var(--border2)', borderRadius: 9, overflow: 'hidden' }}>
            <div className={styles.navBtn} onClick={prevWeek}>
              ‹
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div className={styles.navBtn} onClick={nextWeek}>
              ›
            </div>
          </div>
          <SmallBtn onClick={() => toast('Exporting PDF…')}>PDF</SmallBtn>
          <SmallBtn onClick={() => toast('Exporting Excel…')}>Excel</SmallBtn>
          <button
            onClick={submitWeek}
            style={{
              padding: '9px 16px',
              borderRadius: 9,
              border: 'none',
              background: isDraft ? 'var(--accent)' : 'var(--surface2)',
              color: isDraft ? '#fff' : 'var(--text3)',
              fontSize: 13,
              fontWeight: 600,
              cursor: isDraft ? 'pointer' : 'default',
            }}
          >
            {submitLabel}
          </button>
        </div>
      </div>

      {/* SUBMISSION PROGRESS */}
      <Card pad={false} style={{ padding: '16px 20px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="tnum" style={{ fontSize: 13, fontWeight: 650 }}>
            {fmtH(weekTotal)} / {WEEK_HOURS}h · {weekPctVal}%
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--text3)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text2)' }}>{fmtH(weekRemaining)}h</span> to complete the week
          </span>
        </div>
        <ProgressBar value={pct(weekTotal, WEEK_HOURS)} />
      </Card>

      {/* WEEK GRID */}
      <Card pad={false} style={{ overflow: 'hidden' }}>
        {/* header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            background: 'var(--surface2)',
            borderBottom: '1px solid var(--border)',
            padding: '0 12px',
          }}
        >
          <div style={colHead}>PROJECT / TASK</div>
          {dayCols.map(([label, num, weekend, today]) => (
            <div
              key={label}
              style={{
                ...colHead,
                padding: '11px 6px',
                textAlign: 'center',
                color: today ? 'var(--accent-text)' : 'var(--text3)',
                opacity: weekend ? 0.6 : 1,
              }}
            >
              {label}
              <br />
              <span style={{ fontWeight: 600, color: today ? 'var(--accent-text)' : 'var(--text3)' }}>{num}</span>
            </div>
          ))}
          <div style={{ ...colHead, textAlign: 'right' }}>TOTAL</div>
          <div />
        </div>

        {/* rows */}
        {weekRows.map((r, ri) => {
          const proj = projects[r.p];
          return (
            <div
              key={ri}
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
                <span style={{ width: 9, height: 9, borderRadius: 3, background: proj.color, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {proj.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {proj.client} · {r.task}
                  </div>
                </div>
              </div>
              {r.hours.map((h, ci) => (
                <div key={ci} style={{ padding: 3, background: ci >= 5 ? 'var(--surface2)' : 'transparent' }}>
                  <input
                    className={styles.cell}
                    type="number"
                    step="0.5"
                    min="0"
                    value={h}
                    onChange={(ev) => setCell(ri, ci, ev.target.value)}
                    placeholder="·"
                  />
                </div>
              ))}
              <div className="tnum" style={{ fontSize: 13.5, fontWeight: 700, textAlign: 'right', padding: '0 8px' }}>
                {fmtH(rowSums[ri])}
              </div>
              <div className={styles.removeBtn} title="Remove row" onClick={() => removeWeekRow(ri)}>
                <Icon name="trash" size={12} />
              </div>
            </div>
          );
        })}

        {/* footer totals */}
        <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', background: 'var(--surface2)', padding: '4px 12px' }}>
          <button
            onClick={addWeekRow}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--accent-text)',
              cursor: 'pointer',
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
              {t ? fmtH(t) : '—'}
            </div>
          ))}
          <div className="tnum" style={{ fontSize: 14.5, fontWeight: 700, textAlign: 'right', padding: '0 8px', color: 'var(--accent-text)' }}>
            {fmtH(weekTotal)}h
          </div>
          <div />
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text3)' }}>
        <span>Standard day = 8h · overtime needs a comment</span>
        <span style={{ marginLeft: 'auto' }}>
          Approved weeks lock automatically ·{' '}
          <span onClick={() => toast('Sending to print…')} style={{ color: 'var(--accent-text)', fontWeight: 600, cursor: 'pointer' }}>
            Print
          </span>
        </span>
      </div>
    </PageContainer>
  );
}

const colHead = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'var(--text3)',
  padding: '11px 8px',
} as const;

function SmallBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 13px',
        borderRadius: 9,
        border: '1px solid var(--border2)',
        background: 'var(--surface)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        color: 'var(--text2)',
      }}
    >
      {children}
    </button>
  );
}
