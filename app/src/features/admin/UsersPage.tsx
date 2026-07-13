import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Icon, Modal, PageContainer, type Tone } from '@/components';
import { ApiError } from '@/lib/apiClient';
import {
  ALL_ROLES,
  usersService,
  type AdminUser,
  type AppRole,
  type UserStatus,
} from '@/services/usersService';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { UserFormModal } from './UserFormModal';
import { OneTimePasswordModal } from './OneTimePasswordModal';
import styles from './Users.module.css';

const GRID = '1.7fr 1.6fr 1.3fr 1fr 1fr 150px';

const statusTone: Record<UserStatus, Tone> = {
  Active: 'green',
  Invited: 'amber',
  Inactive: 'neutral',
};

const roleTone: Record<AppRole, Tone> = {
  Admin: 'red',
  Manager: 'accent',
  Employee: 'neutral',
};

export default function UsersPage() {
  const toast = useUiStore((s) => s.showToast);
  const me = useAuthStore((s) => s.user);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [otp, setOtp] = useState<{ user: string; password: string } | null>(null);
  const [confirming, setConfirming] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersService.list({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  // Debounce so typing in search doesn't hammer the API.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const fail = (err: unknown) =>
    toast(err instanceof ApiError ? err.message : 'Something went wrong.');

  const onCreated = (user: AdminUser, password: string) => {
    setShowForm(false);
    setOtp({ user: user.fullName, password });
    toast(`${user.fullName} created`);
    void load();
  };

  const onUpdated = () => {
    setEditing(null);
    toast('User updated');
    void load();
  };

  const resetPassword = async (user: AdminUser) => {
    try {
      const { oneTimePassword } = await usersService.resetPassword(user.id);
      setOtp({ user: user.fullName, password: oneTimePassword });
      void load();
    } catch (err) {
      fail(err);
    }
  };

  const toggleActive = async (user: AdminUser) => {
    try {
      await usersService.setStatus(user.id, !user.isActive);
      toast(user.isActive ? `${user.fullName} deactivated` : `${user.fullName} reactivated`);
      setConfirming(null);
      void load();
    } catch (err) {
      fail(err);
      setConfirming(null);
    }
  };

  return (
    <PageContainer>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>User management</h1>
          <div className={styles.subtitle}>
            {users.length} {users.length === 1 ? 'user' : 'users'} · add people, assign roles, and
            issue one-time passwords
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Icon name="plus" size={13} />
          Add user
        </Button>
      </div>

      {/* FILTERS */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Icon name="search" size={14} />
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={styles.select}
        >
          <option value="">All roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.select}
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Invited">Invited</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* TABLE */}
      <Card pad={false} style={{ overflow: 'hidden' }}>
        <div className={styles.headRow} style={{ gridTemplateColumns: GRID }}>
          <div>USER</div>
          <div>EMAIL</div>
          <div>ROLES</div>
          <div>STATUS</div>
          <div>LAST LOGIN</div>
          <div style={{ textAlign: 'right' }}>ACTIONS</div>
        </div>

        {loading && <div className={styles.empty}>Loading users…</div>}

        {!loading && error && (
          <div className={styles.empty} style={{ color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className={styles.empty}>No users match those filters.</div>
        )}

        {!loading &&
          !error &&
          users.map((u) => {
            const isSelf = u.id === me?.id;
            return (
              <div key={u.id} className={styles.row} style={{ gridTemplateColumns: GRID }}>
                <div className={styles.userCell}>
                  <div className={styles.avatar} style={{ background: u.avatarColor }}>
                    {u.initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className={styles.name}>
                      {u.fullName}
                      {isSelf && <span className={styles.you}>you</span>}
                    </div>
                    <div className={styles.meta}>
                      {[u.title, u.department].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </div>
                </div>

                <div className={styles.emailCell}>{u.email}</div>

                <div className={styles.rolesCell}>
                  {u.roles.map((r) => (
                    <Badge key={r} tone={roleTone[r]}>
                      {r}
                    </Badge>
                  ))}
                </div>

                <div>
                  <Badge tone={statusTone[u.status]}>{u.status}</Badge>
                </div>

                <div className={styles.meta}>
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                </div>

                <div className={styles.actions}>
                  <button className={styles.linkBtn} onClick={() => setEditing(u)}>
                    Edit
                  </button>
                  <button className={styles.linkBtn} onClick={() => resetPassword(u)}>
                    Reset
                  </button>
                  {/* Self-deactivation is blocked server-side; hide it here too. */}
                  {!isSelf && (
                    <button
                      className={`${styles.linkBtn} ${u.isActive ? styles.danger : ''}`}
                      onClick={() => (u.isActive ? setConfirming(u) : toggleActive(u))}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </Card>

      {/* MODALS */}
      {showForm && (
        <UserFormModal
          onClose={() => setShowForm(false)}
          onCreated={onCreated}
          onError={fail}
        />
      )}

      {editing && (
        <UserFormModal
          user={editing}
          onClose={() => setEditing(null)}
          onUpdated={onUpdated}
          onError={fail}
        />
      )}

      {otp && (
        <OneTimePasswordModal
          userName={otp.user}
          password={otp.password}
          onClose={() => setOtp(null)}
        />
      )}

      {confirming && (
        <Modal
          title="Deactivate user"
          onClose={() => setConfirming(null)}
          width={420}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => toggleActive(confirming)}>
                Deactivate
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>{confirming.fullName}</strong> will no longer
            be able to sign in. Their timesheets, approvals, and history are preserved, and you can
            reactivate them at any time.
          </p>
        </Modal>
      )}
    </PageContainer>
  );
}
