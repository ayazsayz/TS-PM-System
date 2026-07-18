import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@/components';
import { brand } from '@/config/brand';
import { ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { AuthShell } from './AuthShell';
import { errorBanner, field, fieldLabel, primaryBtn, ssoBtn } from './authStyles';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const showToast = useUiStore((s) => s.showToast);

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
    <AuthShell>
      <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
        Welcome back
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--text2)' }}>{brand.signInSubtitle}</p>

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
        <span style={{ fontSize: 11.5, color: 'var(--text3)', fontWeight: 500, letterSpacing: '0.04em' }}>OR</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      {error && (
        <div role="alert" style={errorBanner}>
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

      <p style={{ margin: '26px 0 0', fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
        New to {brand.name}?{' '}
        <Link to="/register" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
          Create an organization
        </Link>
      </p>
    </AuthShell>
  );
}
