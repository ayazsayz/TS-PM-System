import { useState, type FormEvent } from 'react';
import { Button, Icon, Modal } from '@/components';
import { ApiError } from '@/lib/apiClient';
import {
  ALL_ROLES,
  usersService,
  type AdminUser,
  type AppRole,
} from '@/services/usersService';
import styles from './Users.module.css';

const roleDescriptions: Record<AppRole, string> = {
  Employee: 'Log time, submit timesheets, manage own tasks.',
  Manager: 'Everything an employee can do, plus approvals, team and reports.',
  Admin: 'Full access, including user management and roles.',
};

interface Props {
  /** Present = edit mode; absent = create mode. */
  user?: AdminUser;
  onClose: () => void;
  onCreated?: (user: AdminUser, oneTimePassword: string) => void;
  onUpdated?: () => void;
  onError: (err: unknown) => void;
}

export function UserFormModal({ user, onClose, onCreated, onUpdated, onError }: Props) {
  const isEdit = Boolean(user);

  const [email, setEmail] = useState(user?.email ?? '');
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [title, setTitle] = useState(user?.title ?? '');
  const [department, setDepartment] = useState(user?.department ?? '');
  const [roles, setRoles] = useState<AppRole[]>(user?.roles ?? ['Employee']);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const toggleRole = (role: AppRole) =>
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setBusy(true);
    try {
      if (isEdit && user) {
        await usersService.update(user.id, {
          fullName,
          title: title || undefined,
          department: department || undefined,
        });
        // Roles are a separate endpoint (has its own server-side guards).
        const same =
          roles.length === user.roles.length && roles.every((r) => user.roles.includes(r));
        if (!same) await usersService.setRoles(user.id, roles);
        onUpdated?.();
      } else {
        const result = await usersService.create({
          email,
          fullName,
          title: title || undefined,
          department: department || undefined,
          roles,
        });
        onCreated?.(result.user, result.oneTimePassword);
      }
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.allMessages);
      else onError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isEdit ? `Edit ${user!.fullName}` : 'Add user'}
      onClose={onClose}
      width={520}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || roles.length === 0}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        {errors.length > 0 && (
          <div className={styles.formError} role="alert">
            {errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        )}

        {!isEdit && (
          <div style={{ display: 'flex', gap: 9, marginBottom: 16, fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.5 }}>
            <Icon name="shield" size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--accent-text)' }} />
            <span>
              A <strong>one-time password</strong> will be generated. The user must change it the
              first time they sign in.
            </span>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Work email
          </label>
          <input
            id="email"
            type="email"
            required
            disabled={isEdit}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className={styles.input}
          />
          {isEdit && (
            <div className={styles.meta} style={{ marginTop: 5 }}>
              Email can't be changed after creation.
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            className={styles.input}
          />
        </div>

        <div className={`${styles.field} ${styles.row2}`}>
          <div>
            <label className={styles.label} htmlFor="title">
              Job title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Consultant"
              className={styles.input}
            />
          </div>
          <div>
            <label className={styles.label} htmlFor="department">
              Department
            </label>
            <input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Engineering"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Roles</label>
          {ALL_ROLES.map((role) => {
            const active = roles.includes(role);
            return (
              <label
                key={role}
                className={`${styles.roleOption} ${active ? styles.roleOptionActive : ''}`}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleRole(role)}
                  style={{ marginTop: 2, accentColor: 'var(--accent)' }}
                />
                <div>
                  <div className={styles.roleName}>{role}</div>
                  <div className={styles.roleDesc}>{roleDescriptions[role]}</div>
                </div>
              </label>
            );
          })}
          {roles.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--red)' }}>Select at least one role.</div>
          )}
        </div>
      </form>
    </Modal>
  );
}
