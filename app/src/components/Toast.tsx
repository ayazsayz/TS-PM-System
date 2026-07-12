import { useUiStore } from '@/store/useUiStore';
import { Icon } from './Icon';

/** Global toast host — reads the transient message from the UI store. */
export function Toast() {
  const toast = useUiStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 26,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--text)',
        color: 'var(--bg)',
        padding: '11px 18px',
        borderRadius: 10,
        boxShadow: 'var(--shadow-lg)',
        fontSize: 13.5,
        fontWeight: 600,
        animation: 'toastIn 0.22s ease both',
      }}
    >
      <Icon name="check" size={15} strokeWidth={2} />
      {toast}
    </div>
  );
}
