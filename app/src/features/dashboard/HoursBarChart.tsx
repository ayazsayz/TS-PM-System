import type { CSSProperties } from 'react';

/**
 * "Hours this week" stacked bar chart. Bar heights mirror the mockup exactly
 * (non-billable segment on top, billable below). Fri is today (dashed), and
 * the weekend columns are empty stubs.
 */

interface Day {
  label: string;
  nonBillable?: number;
  billable?: number;
  today?: boolean;
  weekend?: boolean;
}

const days: Day[] = [
  { label: 'Mon', nonBillable: 8, billable: 104 },
  { label: 'Tue', nonBillable: 14, billable: 98 },
  { label: 'Wed', nonBillable: 6, billable: 106 },
  { label: 'Thu', nonBillable: 10, billable: 102 },
  { label: 'Fri', billable: 91, today: true },
  { label: 'Sat', weekend: true },
  { label: 'Sun', weekend: true },
];

const col: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  height: '100%',
  justifyContent: 'flex-end',
};

export function HoursBarChart() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 14, alignItems: 'end', height: 150 }}>
      {days.map((d) => (
        <div key={d.label} style={col}>
          <div style={{ width: '100%', maxWidth: 44, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {d.weekend ? (
              <div style={{ height: 3, borderRadius: 4, background: 'var(--surface2)' }} />
            ) : d.today ? (
              <div
                style={{
                  height: d.billable,
                  borderRadius: '2px 2px 4px 4px',
                  background: 'var(--accent)',
                  opacity: 0.55,
                  border: '1px dashed var(--accent)',
                }}
              />
            ) : (
              <>
                <div style={{ height: d.nonBillable, borderRadius: '4px 4px 2px 2px', background: 'var(--border2)' }} />
                <div style={{ height: d.billable, borderRadius: '2px 2px 4px 4px', background: 'var(--accent)' }} />
              </>
            )}
          </div>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: d.today ? 700 : 600,
              color: d.today ? 'var(--accent-text)' : 'var(--text3)',
            }}
          >
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}
