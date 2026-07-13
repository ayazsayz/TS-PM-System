import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Icon } from '@/components';
import { brand } from '@/config/brand';
import { ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';

/** Password rules — mirrors the server-side policy. */
const rules: { label: string; test: (v: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'An uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'A lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'A number', test: (v) => /[0-9]/.test(v) },
];

/**
 * Serves two flows:
 *  - Forced: user signed in with an admin-issued one-time password and cannot
 *    use the app until they set a real one.
 *  - Voluntary: any signed-in user changing their password.
 */
export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const forced = useAuthStore((s) => s.mustChangePassword);
  const changePassword = useAuthStore((s) => s.changePassword);
  const logout = useAuthStore((s) => s.logout);
  const showToast = useUiStore((s) => s.showToast);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const rulesPass = rules.every((r) => r.test(next));
  const matches = next.length > 0 && next === confirm;
  const canSubmit = current.length > 0 && rulesPass && matches && !busy;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setBusy(true);
    try {
      await changePassword(current, next);
      showToast('Password updated');
      navigate('/dashboard');
    } catch (err) {
      setErrors(err instanceof ApiError ? err.allMessages : ['Could not update password.']);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (forced) {
      // Can't stay signed in on a one-time password — sign out instead.
      await logout();
      navigate('/login');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: 24,
      }}
    >
      <Card style={{ width: 440, padding: 28 }} pad={false}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
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
          <div style={{ fontSize: 15, fontWeight: 700 }}>
            {brand.name} <span style={{ fontWeight: 500, color: 'var(--text3)' }}>{brand.suffix}</span>
          </div>
        </div>

        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {forced ? 'Set your password' : 'Change password'}
        </h1>
        <p style={{ margin: '0 0 22px', fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.5 }}>
          {forced ? (
            <>
              You signed in with a one-time password. Choose a new password to finish setting up
              {user ? ` ${user.email}` : ' your account'}.
            </>
          ) : (
            'Enter your current password and choose a new one.'
          )}
        </p>

        {errors.length > 0 && (
          <div
            role="alert"
            style={{
              background: 'var(--red-soft)',
              color: 'var(--red)',
              border: '1px solid var(--red)',
              borderRadius: 9,
              padding: '10px 12px',
              fontSize: 12.5,
              marginBottom: 16,
            }}
          >
            {errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field
            id="current"
            label={forced ? 'One-time password' : 'Current password'}
            value={current}
            onChange={setCurrent}
            autoComplete="current-password"
          />
          <Field
            id="new"
            label="New password"
            value={next}
            onChange={setNext}
            autoComplete="new-password"
          />

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 5 }}>
            {rules.map((r) => {
              const ok = r.test(next);
              return (
                <li
                  key={r.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 12,
                    color: ok ? 'var(--green)' : 'var(--text3)',
                  }}
                >
                  <Icon name={ok ? 'check' : 'close'} size={11} strokeWidth={2.4} />
                  {r.label}
                </li>
              );
            })}
          </ul>

          <Field
            id="confirm"
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
          />
          {confirm.length > 0 && !matches && (
            <div style={{ fontSize: 12, color: 'var(--red)', marginTop: -6 }}>
              Passwords do not match.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button type="submit" variant="primary" disabled={!canSubmit} style={{ flex: 1 }}>
              {busy ? 'Updating…' : 'Update password'}
            </Button>
            <Button type="button" variant="secondary" onClick={cancel}>
              {forced ? 'Sign out' : 'Cancel'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--text2)',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 40px 10px 12px',
            borderRadius: 9,
            border: '1px solid var(--border2)',
            background: 'var(--surface)',
            fontSize: 14,
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text3)',
            padding: 4,
            display: 'flex',
          }}
        >
          <Icon name={show ? 'moon' : 'sun'} size={14} />
        </button>
      </div>
    </div>
  );
}
