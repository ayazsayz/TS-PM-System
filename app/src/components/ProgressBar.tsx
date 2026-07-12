import type { CSSProperties } from 'react';

interface ProgressBarProps {
  /** 0–100 (values above 100 are clamped to full width). */
  value: number;
  /** Fill color — any CSS color / var. Default accent. */
  color?: string;
  /** Track height in px. Default 8. */
  height?: number;
  track?: string;
  style?: CSSProperties;
}

/** Rounded track + fill progress bar used across dashboards and timesheets. */
export function ProgressBar({
  value,
  color = 'var(--accent)',
  height = 8,
  track = 'var(--surface2)',
  style,
}: ProgressBarProps) {
  const w = Math.max(0, Math.min(100, value));
  return (
    <div
      style={{
        height,
        borderRadius: 99,
        background: track,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          width: `${w}%`,
          height: '100%',
          borderRadius: 99,
          background: color,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}
