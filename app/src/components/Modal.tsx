import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Footer actions (buttons). */
  footer?: ReactNode;
  width?: number;
  /** Hide the close affordances (used for the one-time-password reveal). */
  dismissible?: boolean;
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  width = 480,
  dismissible = true,
}: ModalProps) {
  // Esc closes; body scroll is locked while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, dismissible]);

  // Rendered through a portal to <body>. A `position: fixed` overlay is trapped by
  // any ancestor with a transform/filter (our page fade-in animation leaves an
  // identity transform), which would clip the backdrop to the page container.
  return createPortal(
    <div
      onClick={() => dismissible && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,13,20,.45)',
        backdropFilter: 'blur(2px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        overflowY: 'auto',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="animate-pop-in"
        style={{
          width,
          maxWidth: '94vw',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          marginBottom: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 650 }}>{title}</div>
          {dismissible && (
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text3)',
              }}
            >
              <Icon name="close" size={13} />
            </button>
          )}
        </div>

        <div style={{ padding: 20 }}>{children}</div>

        {footer && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              padding: '14px 20px',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface2)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
