import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@/components';
import { brand } from '@/config/brand';
import { ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { AuthShell } from './AuthShell';
import { errorBanner, field, fieldLabel, primaryBtn } from './authStyles';

const rules: { label: string; test: (v: string) => boolean }[] = [
  { label: '8+ characters', test: (v) => v.length >= 8 },
  { label: 'Uppercase', test: (v) => /[A-Z]/.test(v) },
  { label: 'Lowercase', test: (v) => /[a-z]/.test(v) },
  { label: 'Number', test: (v) => /[0-9]/.test(v) },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const showToast = useUiStore((s) => s.showToast);

  const [organizationName, setOrganizationName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const passwordOk = rules.every((r) => r.test(password));
  const canSubmit = organizationName && fullName && email && passwordOk && !busy;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setBusy(true);
    try {
      await register(organizationName, fullName, email, password);
      showToast(`Welcome to ${useAuthStore.getState().user?.organizationName ?? brand.name}`);
      navigate('/dashboard');
    } catch (err) {
      setErrors(err instanceof ApiError ? err.allMessages : ['Could not create your organization.']);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
        Create your organization
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text2)' }}>
        Set up a new {brand.name} workspace — you’ll be its administrator.
      </p>

      {errors.length > 0 && (
        <div role="alert" style={errorBanner}>
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}

      <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={submit}>
        <div>
          <label style={fieldLabel} htmlFor="org">
            Organization name
          </label>
          <input
            id="org"
            required
            placeholder="Acme Inc"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            style={field}
          />
        </div>
        <div>
          <label style={fieldLabel} htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            required
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={field}
          />
        </div>
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
          <label style={fieldLabel} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={field}
          />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            {rules.map((r) => {
              const ok = r.test(password);
              return (
                <span
                  key={r.label}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: ok ? 'var(--green)' : 'var(--text3)' }}
                >
                  <Icon name={ok ? 'check' : 'close'} size={10} strokeWidth={2.4} />
                  {r.label}
                </span>
              );
            })}
          </div>
        </div>
        <button type="submit" disabled={!canSubmit} style={{ ...primaryBtn, opacity: canSubmit ? 1 : 0.6 }}>
          {busy ? 'Creating…' : 'Create organization'}
        </button>
      </form>

      <p style={{ margin: '26px 0 0', fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
