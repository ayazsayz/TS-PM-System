import { useEffect, useState } from 'react';
import { endImpersonation, getImpersonationInfo } from '@/lib/impersonation';

export function ImpersonationBanner() {
  const [info] = useState(() => getImpersonationInfo());
  const [remaining, setRemaining] = useState<string>('');

  useEffect(() => {
    if (!info?.expiresAt) return;
    const tick = () => {
      const ms = new Date(info.expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining('expired');
        return;
      }
      const total = Math.floor(ms / 1000);
      const mm = Math.floor(total / 60);
      const ss = String(total % 60).padStart(2, '0');
      setRemaining(`${mm}:${ss}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [info]);

  if (!info) return null;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '10px 16px',
        background: '#fff7ed',
        color: '#7c2d12',
        borderBottom: '1px solid #fdba74',
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden>
          <path
            d="M10 2.5a7.5 7.5 0 1 0 7.5 7.5A7.5 7.5 0 0 0 10 2.5Zm0 4.17v3.75m0 2.5h.01"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>
          You are impersonating <strong>{info.actor}</strong>. Actions you take are being logged as
          performed by <strong>{info.impersonatorEmail}</strong>.
          {remaining ? <span style={{ marginLeft: 8, opacity: 0.8 }}>(session ends in {remaining})</span> : null}
        </span>
      </div>
      <button
        type="button"
        onClick={endImpersonation}
        style={{
          background: '#7c2d12',
          color: '#fff',
          border: 'none',
          padding: '6px 12px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        End impersonation
      </button>
    </div>
  );
}
