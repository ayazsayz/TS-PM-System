import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components';
import { brand } from '@/config/brand';
import { ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';

/** Full split-hero login, reproducing the mockup's login screen. */
export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const showToast = useUiStore((s) => s.showToast);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const doLogin = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      // A user still on a one-time password is forced to change it first.
      if (useAuthStore.getState().mustChangePassword) {
        navigate('/change-password');
        return;
      }
      showToast(`Welcome back, ${useAuthStore.getState().user?.fullName.split(' ')[0] ?? ''}`);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const ssoUnavailable = () => setError('SSO is not configured yet — sign in with your email.');

  return (
    <div
      data-screen-label="Login"
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
            {brand.name}{' '}
            <span style={{ fontWeight: 500, color: 'rgba(255,255,255,.55)' }}>{brand.suffix}</span>
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
          <p
            style={{
              margin: '0 0 36px',
              fontSize: 16,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,.6)',
              maxWidth: 400,
            }}
          >
            {brand.heroSubtitle}
          </p>
          <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
            <HeroStat label="This week">
              <div className="tnum" style={statValue}>
                38.5h
              </div>
              <div
                style={{
                  height: 5,
                  borderRadius: 99,
                  background: 'rgba(255,255,255,.14)',
                  marginTop: 10,
                  overflow: 'hidden',
                }}
              >
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
              <div style={{ fontSize: 11.5, color: '#41C980', marginTop: 10, fontWeight: 600 }}>
                ▲ 4% vs last week
              </div>
            </HeroStat>
          </div>
        </div>

        <div style={{ position: 'relative', fontSize: 12.5, color: 'rgba(255,255,255,.4)' }}>
          Trusted by teams at {brand.clients.join(' · ')}
        </div>
      </div>

      {/* ---- FORM ---- */}
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

        <div style={{ width: '100%', maxWidth: 392, animation: 'fadeUp 0.5s ease both' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Welcome back
          </h2>
          <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text2)' }}>
            {brand.signInSubtitle}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <button type="button" onClick={ssoUnavailable} style={ssoBtn}>
              <Icon name="microsoft" size={16} />
              Continue with Microsoft
            </button>
            <button type="button" onClick={ssoUnavailable} style={ssoBtn}>
              <Icon name="shield" size={15} />
              Single sign-on (SSO)
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--text3)', fontWeight: 500, letterSpacing: '0.04em' }}>
              OR
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {error && (
            <div
              role="alert"
              style={{
                background: 'var(--red-soft)',
                color: 'var(--red)',
                border: '1px solid var(--red)',
                borderRadius: 9,
                padding: '10px 12px',
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}

          <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={doLogin}>
            <div>
              <label style={fieldLabel} htmlFor="email">
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={field}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <label style={{ ...fieldLabel, marginBottom: 0 }} htmlFor="password">
                  Password
                </label>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--accent-text)', cursor: 'pointer' }}>
                  Forgot password?
                </span>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={field}
              />
            </div>
            <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ margin: '26px 0 0', fontSize: 12.5, color: 'var(--text3)', textAlign: 'center' }}>
            Need access? Contact your workspace administrator
          </p>
        </div>
      </div>
    </div>
  );
}

const statValue = { fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' } as const;

function HeroStat({
  label,
  minWidth = 160,
  children,
}: {
  label: string;
  minWidth?: number;
  children: React.ReactNode;
}) {
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

const ssoBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  width: '100%',
  padding: 11,
  borderRadius: 9,
  border: '1px solid var(--border2)',
  background: 'var(--surface)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  color: 'var(--text)',
} as const;

const primaryBtn = {
  width: '100%',
  padding: 11,
  borderRadius: 9,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 4,
} as const;

const fieldLabel = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--text2)',
  marginBottom: 6,
} as const;

const field = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 9,
  border: '1px solid var(--border2)',
  background: 'var(--surface)',
  fontSize: 14,
} as const;
