import type { ReactNode } from 'react';
import { Card } from './Card';

interface KpiCardProps {
  label: string;
  /** Main value — string or composed node (e.g. with a "/ 8h" suffix). */
  value: ReactNode;
  /** Optional foreground color for the value. */
  valueColor?: string;
  /** Footer line — a delta, hint, or link. */
  footer?: ReactNode;
  hoverable?: boolean;
  onClick?: () => void;
}

/** Compact metric tile used in the KPI rows across dashboards and reports. */
export function KpiCard({ label, value, valueColor, footer, hoverable, onClick }: KpiCardProps) {
  return (
    <Card
      pad={false}
      hoverable={hoverable}
      onClick={onClick}
      style={{ padding: 18, cursor: onClick ? 'pointer' : undefined }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text3)', marginBottom: 10 }}>
        {label}
      </div>
      <div
        className="tnum"
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: valueColor,
        }}
      >
        {value}
      </div>
      {footer && <div style={{ marginTop: 10 }}>{footer}</div>}
    </Card>
  );
}
