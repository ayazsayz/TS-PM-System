import type { CSSProperties, ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  /** Apply the standard 20px padding. Default true. */
  pad?: boolean;
  /** Lift shadow on hover. */
  hoverable?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Card({ children, pad = true, hoverable, className, style, onClick }: CardProps) {
  const cls = [styles.card, pad && styles.pad, hoverable && styles.hoverable, className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} style={style} onClick={onClick}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  action?: ReactNode;
}

/** Standard card header: bold title on the left, optional action on the right. */
export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.title}>{title}</div>
      {action}
    </div>
  );
}
