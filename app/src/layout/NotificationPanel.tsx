import { Icon, type IconName, type Tone } from '@/components';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import type { Notification } from '@/services/workspaceService';

const severityStyle: Record<Notification['severity'], { tone: Tone; icon: IconName }> = {
  warning: { tone: 'amber', icon: 'alert' },
  danger: { tone: 'red', icon: 'x-circle' },
  success: { tone: 'green', icon: 'check' },
  info: { tone: 'accent', icon: 'clock' },
};

const toneColors: Record<Tone, { bg: string; fg: string }> = {
  amber: { bg: 'var(--amber-soft)', fg: 'var(--amber)' },
  accent: { bg: 'var(--accent-soft)', fg: 'var(--accent-text)' },
  red: { bg: 'var(--red-soft)', fg: 'var(--red)' },
  green: { bg: 'var(--green-soft)', fg: 'var(--green)' },
  neutral: { bg: 'var(--surface2)', fg: 'var(--text2)' },
};

export function NotificationPanel() {
  const notifications = useWorkspaceStore((s) => s.notifications);
  const markAllRead = useWorkspaceStore((s) => s.markAllRead);

  return (
    <div
      style={{
        position: 'absolute',
        top: 52,
        right: 70,
        width: 360,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-lg)',
        animation: 'popIn 0.18s ease both',
        overflow: 'hidden',
        zIndex: 60,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 650 }}>Notifications</div>
        {notifications.some((n) => !n.isRead) && (
          <div
            onClick={() => void markAllRead()}
            style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', cursor: 'pointer' }}
          >
            Mark all read
          </div>
        )}
      </div>

      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {notifications.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
            You’re all caught up.
          </div>
        )}

        {notifications.map((n, i) => {
          const s = severityStyle[n.severity] ?? severityStyle.info;
          const c = toneColors[s.tone];
          return (
            <div
              key={n.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '13px 16px',
                borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : undefined,
                background: n.isRead ? 'transparent' : 'var(--bg)',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: c.bg,
                  color: c.fg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={s.icon} size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, lineHeight: 1.45 }}>{n.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 3 }}>
                  {[n.category, n.ago].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
