import type { ReactNode } from 'react';
import styles from './Badge.module.css';

export type Tone = 'green' | 'amber' | 'red' | 'accent' | 'neutral';

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

/** Pill status badge (soft background + toned text). */
export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  const cls = [styles.badge, styles[tone], className].filter(Boolean).join(' ');
  return <span className={cls}>{children}</span>;
}
