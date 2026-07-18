import type { ReactNode } from 'react';
import { Icon } from '@/components';
import { brand } from '@/config/brand';
import { useUiStore } from '@/store/useUiStore';

const statValue = { fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' } as const;

/** Split-hero layout shared by the Login and Register screens. */
export function AuthShell({ children }: { children: ReactNode }) {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: 1080,
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        background: 'var(--bg)',
      }}
    >
      {/* ---- HERO ---- */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: '#10142E',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '44px 52px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)',
            backgroundSize: '44px 44px',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: -180,
            bottom: -180,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background:
              'radial-gradient(circle,color-mix(in oklab,var(--accent) 40%,transparent) 0%,transparent 68%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 15,
              color: '#fff',
            }}
          >
            {brand.logoMark}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>
            {brand.name}
            {brand.suffix && (
              <span style={{ fontWeight: 500, color: 'rgba(255,255,255,.55)' }}> {brand.suffix}</span>
            )}
          </div>
        </div>

        <div style={{ position: 'relative', maxWidth: 520 }}>
          <h1
            style={{
              margin: '0 0 16px',
              fontSize: 46,
              lineHeight: 1.08,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              textWrap: 'balance',
            }}
          >
            {brand.heroTitle}
          </h1>
          <p style={{ margin: '0 0 36px', fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,.6)', maxWidth: 400 }}>
            {brand.heroSubtitle}
          </p>
          <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
            <HeroStat label="This week">
              <div className="tnum" style={statValue}>
                38.5h
              </div>
              <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.14)', marginTop: 10, overflow: 'hidden' }}>
                <div style={{ width: '76%', height: '100%', borderRadius: 99, background: 'var(--accent)' }} />
              </div>
            </HeroStat>
            <HeroStat label="Approvals">
              <div className="tnum" style={statValue}>
                4 <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.55)' }}>pending</span>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                {['#EFA84E', '#EFA84E', '#41C980', '#41C980'].map((c, i) => (
                  <div key={i} style={{ width: 18, height: 5, borderRadius: 99, background: c }} />
                ))}
              </div>
            </HeroStat>
            <HeroStat label="Billable" minWidth={150}>
              <div className="tnum" style={statValue}>
                78%
              </div>
              <div style={{ fontSize: 11.5, color: '#41C980', marginTop: 10, fontWeight: 600 }}>▲ 4% vs last week</div>
            </HeroStat>
          </div>
        </div>

        <div style={{ position: 'relative', fontSize: 12.5, color: 'rgba(255,255,255,.4)' }}>
          Trusted by teams at {brand.clients.join(' · ')}
        </div>
      </div>

      {/* ---- RIGHT PANEL ---- */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: 40,
        }}
      >
        <div
          onClick={toggleTheme}
          style={{
            position: 'absolute',
            top: 24,
            right: 28,
            width: 36,
            height: 36,
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text2)',
          }}
        >
          <Icon name={theme === 'light' ? 'sun' : 'moon'} size={16} />
        </div>

        <div style={{ width: '100%', maxWidth: 392, animation: 'fadeUp 0.5s ease both' }}>{children}</div>
      </div>
    </div>
  );
}

function HeroStat({ label, minWidth = 160, children }: { label: string; minWidth?: number; children: ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,.06)',
        border: '1px solid rgba(255,255,255,.12)',
        backdropFilter: 'blur(6px)',
        borderRadius: 12,
        padding: '16px 18px',
        minWidth,
      }}
    >
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
