import type { CSSProperties } from 'react';

/**
 * Centralized icon set. Paths are lifted verbatim from the ui-mockup so the
 * line weights and shapes match exactly. Stroke icons inherit `currentColor`.
 */
export type IconName =
  | 'dashboard'
  | 'clock'
  | 'calendar'
  | 'team'
  | 'check-circle'
  | 'folder'
  | 'bars'
  | 'search'
  | 'sun'
  | 'moon'
  | 'sliders'
  | 'bell'
  | 'logout'
  | 'plus'
  | 'alert'
  | 'x-circle'
  | 'check'
  | 'copy'
  | 'trash'
  | 'shield'
  | 'close'
  | 'microsoft';

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  style?: CSSProperties;
  className?: string;
}

const STROKE: Partial<Record<IconName, { d?: string; body?: React.ReactNode; sw?: number }>> = {
  dashboard: {
    body: (
      <>
        <rect x="2" y="2" width="5" height="5" rx="1.2" />
        <rect x="9" y="2" width="5" height="5" rx="1.2" />
        <rect x="2" y="9" width="5" height="5" rx="1.2" />
        <rect x="9" y="9" width="5" height="5" rx="1.2" />
      </>
    ),
    sw: 1.5,
  },
  clock: {
    body: (
      <>
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4.8V8l2.2 1.6" />
      </>
    ),
    sw: 1.5,
  },
  calendar: { d: 'M2 6.5h12M5.5 1.5v3M10.5 1.5v3', body: <rect x="2" y="3" width="12" height="11" rx="1.5" />, sw: 1.5 },
  team: {
    body: (
      <>
        <circle cx="5.5" cy="5" r="2.4" />
        <path d="M1.6 13.4c.3-2.1 1.9-3.6 3.9-3.6s3.6 1.5 3.9 3.6" />
        <circle cx="11.5" cy="5.6" r="1.9" />
        <path d="M11 9.6c1.9.2 3.2 1.6 3.4 3.5" />
      </>
    ),
    sw: 1.5,
  },
  'check-circle': {
    body: (
      <>
        <circle cx="8" cy="8" r="6.2" />
        <path d="M5.4 8.1l1.8 1.8 3.4-3.8" />
      </>
    ),
    sw: 1.5,
  },
  folder: { d: 'M2 4.5C2 3.7 2.7 3 3.5 3H6l1.5 2h5c.8 0 1.5.7 1.5 1.5v6c0 .8-.7 1.5-1.5 1.5h-9C2.7 14 2 13.3 2 12.5z', sw: 1.5 },
  bars: { d: 'M3 13.5V9M8 13.5V3.5M13 13.5V6.5', sw: 1.7 },
  search: {
    body: (
      <>
        <circle cx="7" cy="7" r="4.5" />
        <path d="M10.5 10.5L14 14" />
      </>
    ),
    sw: 1.6,
  },
  sun: {
    body: (
      <>
        <circle cx="8" cy="8" r="3.2" />
        <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" />
      </>
    ),
    sw: 1.5,
  },
  moon: { d: 'M13.5 9.5A5.7 5.7 0 0 1 6.5 2.5a5.7 5.7 0 1 0 7 7z', sw: 1.5 },
  sliders: {
    body: (
      <>
        <path d="M2 4.5h7M12 4.5h2M2 11.5h2M7 11.5h7" />
        <circle cx="10.5" cy="4.5" r="1.8" />
        <circle cx="5.5" cy="11.5" r="1.8" />
      </>
    ),
    sw: 1.5,
  },
  bell: { d: 'M8 1.8a4.2 4.2 0 0 1 4.2 4.2c0 3 1.3 4.4 1.3 4.4H2.5s1.3-1.4 1.3-4.4A4.2 4.2 0 0 1 8 1.8zM6.5 13a1.6 1.6 0 0 0 3 0', sw: 1.5 },
  logout: { d: 'M6 2H3.5C2.7 2 2 2.7 2 3.5v9c0 .8.7 1.5 1.5 1.5H6M10.5 11l3-3-3-3M13.5 8H6', sw: 1.5 },
  plus: { d: 'M8 3v10M3 8h10', sw: 2 },
  alert: { d: 'M8 5.5V9M8 11.2v.1M6.9 2.2L1.6 11.4a1.3 1.3 0 0 0 1.1 2h10.6a1.3 1.3 0 0 0 1.1-2L9.1 2.2a1.3 1.3 0 0 0-2.2 0z', sw: 1.5 },
  'x-circle': {
    body: (
      <>
        <circle cx="8" cy="8" r="6.2" />
        <path d="M5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4" />
      </>
    ),
    sw: 1.5,
  },
  check: { d: 'M2.5 8.5l3.5 3.5 7.5-8', sw: 2 },
  copy: { d: 'M11 5V3.5C11 2.7 10.3 2 9.5 2h-6C2.7 2 2 2.7 2 3.5v6c0 .8.7 1.5 1.5 1.5H5', body: <rect x="5" y="5" width="9" height="9" rx="1.5" />, sw: 1.5 },
  trash: { d: 'M3 4.5h10M6.5 2.5h3M5 4.5l.5 9h5l.5-9', sw: 1.6 },
  shield: { d: 'M8 1.8l5.5 2.4v3.4c0 3.3-2.3 5.7-5.5 6.6-3.2-.9-5.5-3.3-5.5-6.6V4.2z M5.8 8l1.6 1.6 2.8-3', sw: 1.5 },
  close: { d: 'M4 4l8 8M12 4l-8 8', sw: 1.8 },
};

export function Icon({ name, size = 16, strokeWidth, style, className }: IconProps) {
  // Microsoft logo is a special multicolor fill icon.
  if (name === 'microsoft') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" style={style} className={className}>
        <rect x="0.5" y="0.5" width="7" height="7" fill="#F25022" />
        <rect x="8.5" y="0.5" width="7" height="7" fill="#7FBA00" />
        <rect x="0.5" y="8.5" width="7" height="7" fill="#00A4EF" />
        <rect x="8.5" y="8.5" width="7" height="7" fill="#FFB900" />
      </svg>
    );
  }

  const def = STROKE[name];
  if (!def) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth ?? def.sw ?? 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
    >
      {def.body}
      {def.d && <path d={def.d} />}
    </svg>
  );
}
