import type { ReactNode } from 'react';
import { Icon, type IconName, type Tone } from '@/components';
import { useUiStore } from '@/store/useUiStore';

interface NotifItem {
  icon: IconName;
  tone: Tone;
  body: ReactNode;
  meta: string;
}

const items: NotifItem[] = [
  {
    icon: 'alert',
    tone: 'amber',
    body: (
      <>
        <strong>Atlas Mobile Banking</strong> exceeded its estimated hours by 110h
      </>
    ),
    meta: 'Project risk · 25 min ago',
  },
  {
    icon: 'clock',
    tone: 'accent',
    body: (
      <>
        4 timesheets are <strong>awaiting your approval</strong> for the week of Jun 22
      </>
    ),
    meta: 'Approvals · 1 h ago',
  },
  {
    icon: 'x-circle',
    tone: 'red',
    body: (
      <>
        <strong>Tom Okafor</strong> hasn't submitted last week's timesheet — escalated to you
      </>
    ),
    meta: 'Escalation · 3 h ago',
  },
  {
    icon: 'check',
    tone: 'green',
    body: (
      <>
        Your timesheet for <strong>Jun 15 – 21</strong> was approved by Dana Whitfield
      </>
    ),
    meta: 'Timesheet · Yesterday',
  },
];

const toneStyle: Record<Tone, { bg: string; fg: string }> = {
  amber: { bg: 'var(--amber-soft)', fg: 'var(--amber)' },
  accent: { bg: 'var(--accent-soft)', fg: 'var(--accent-text)' },
  red: { bg: 'var(--red-soft)', fg: 'var(--red)' },
  green: { bg: 'var(--green-soft)', fg: 'var(--green)' },
  neutral: { bg: 'var(--surface2)', fg: 'var(--text2)' },
};

export function NotificationPanel() {
  const markAllRead = useUiStore((s) => s.markAllRead);

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
        <div
          onClick={markAllRead}
          style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', cursor: 'pointer' }}
        >
          Mark all read
        </div>
      </div>

      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {items.map((it, i) => {
          const t = toneStyle[it.tone];
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                padding: '13px 16px',
                borderBottom: i < items.length - 1 ? '1px solid var(--border)' : undefined,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: t.bg,
                  color: t.fg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={it.icon} size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, lineHeight: 1.45 }}>{it.body}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 3 }}>{it.meta}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--text2)',
          cursor: 'pointer',
        }}
      >
        View all notifications
      </div>
    </div>
  );
}
