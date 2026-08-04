import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, subtitle, onClose, children }: ModalProps) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <h2>{title}</h2>
        {subtitle ? <p className="modal-subtitle">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  );
}
