import { useToastStore } from '@/store/useToastStore';

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast${t.type === 'success' ? ' toast-success' : ''}${t.type === 'error' ? ' toast-error' : ''}`}
          onClick={() => dismiss(t.id)}
          role="status"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
