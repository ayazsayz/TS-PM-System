import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usersService, type SuperAdminUserDto, type UserRole } from '@/services/usersService';
import { organizationsService, type OrgDto } from '@/services/organizationsService';
import { Modal } from '@/components/Modal';
import { toast } from '@/store/useToastStore';
import { ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/store/useAuthStore';

const ALL_ROLES: UserRole[] = ['Employee', 'Manager', 'Admin', 'SuperAdmin'];

const STATUS_BADGE: Record<SuperAdminUserDto['status'], string> = {
  Active: 'badge-success',
  Invited: 'badge-info',
  Inactive: 'badge-danger',
};

function RolesModal({
  user,
  onClose,
  onSaved,
}: {
  user: SuperAdminUserDto;
  onClose: () => void;
  onSaved: (u: SuperAdminUserDto) => void;
}) {
  const [selected, setSelected] = useState<Set<UserRole>>(new Set(user.roles));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (role: UserRole) => {
    const next = new Set(selected);
    next.has(role) ? next.delete(role) : next.add(role);
    setSelected(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const updated = await usersService.setRoles(user.id, Array.from(selected));
      toast.success('Roles updated.');
      onSaved(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.allMessages.join(' ') : 'Failed to update roles.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Roles — ${user.fullName}`} subtitle={user.email} onClose={onClose}>
      {error ? <div className="banner-error">{error}</div> : null}
      <form onSubmit={submit}>
        <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ALL_ROLES.map((role) => (
            <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={selected.has(role)} onChange={() => toggle(role)} />
              {role}
            </label>
          ))}
          <span className="field-hint">Employee is the default role when nothing else is selected.</span>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save roles'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordResult({ user, otp, onClose }: { user: SuperAdminUserDto; otp: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(otp);
    setCopied(true);
  };
  return (
    <Modal
      title="Password reset"
      subtitle={`Share this one-time password with ${user.fullName}. They will be forced to change it on next login.`}
      onClose={onClose}
    >
      <div className="banner-error" style={{ background: 'var(--color-warning-soft)', color: 'var(--color-warning)' }}>
        This password will not be shown again once you close this dialog.
      </div>
      <div
        style={{
          padding: 16,
          background: 'var(--color-primary-soft)',
          borderRadius: 8,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          fontSize: 18,
          textAlign: 'center',
          fontWeight: 600,
          color: 'var(--color-primary)',
          margin: '12px 0',
        }}
      >
        {otp}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={copy}>
          {copied ? 'Copied!' : 'Copy password'}
        </button>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}

export function UsersPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [users, setUsers] = useState<SuperAdminUserDto[] | null>(null);
  const [orgs, setOrgs] = useState<OrgDto[]>([]);
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editingRoles, setEditingRoles] = useState<SuperAdminUserDto | null>(null);
  const [resetResult, setResetResult] = useState<{ user: SuperAdminUserDto; otp: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    const data = await usersService.list({
      search: search.trim() || undefined,
      organizationId: orgFilter || undefined,
      role: (roleFilter as UserRole) || undefined,
      status: (statusFilter as SuperAdminUserDto['status']) || undefined,
    });
    setUsers(data);
  };

  useEffect(() => {
    void (async () => setOrgs(await organizationsService.list()))();
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgFilter, roleFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const orgOptions = useMemo(() => [...orgs].sort((a, b) => a.name.localeCompare(b.name)), [orgs]);

  const toggleActive = async (user: SuperAdminUserDto) => {
    setBusyId(user.id);
    try {
      const updated = user.isActive
        ? await usersService.deactivate(user.id)
        : await usersService.activate(user.id);
      toast.success(`${updated.fullName} ${updated.isActive ? 'activated' : 'deactivated'}.`);
      setUsers((prev) => prev?.map((u) => (u.id === updated.id ? updated : u)) ?? null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.allMessages.join(' ') : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const resetPassword = async (user: SuperAdminUserDto) => {
    setBusyId(user.id);
    try {
      const { oneTimePassword } = await usersService.resetPassword(user.id);
      setResetResult({ user, otp: oneTimePassword });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.allMessages.join(' ') : 'Failed to reset password.');
    } finally {
      setBusyId(null);
    }
  };

  const impersonate = async (user: SuperAdminUserDto) => {
    setBusyId(user.id);
    try {
      const res = await usersService.impersonate(user.id);
      const appUrl = (import.meta.env.VITE_APP_URL as string | undefined) ?? 'http://localhost:5173';
      const hash = new URLSearchParams({
        imp_token: res.accessToken,
        imp_exp: res.accessTokenExpiresAt,
        imp_actor: user.fullName,
      }).toString();
      window.open(`${appUrl}/#${hash}`, '_blank', 'noopener');
      toast.success(`Opened tenant app as ${user.fullName}. Session expires ${new Date(res.accessTokenExpiresAt).toLocaleTimeString()}.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.allMessages.join(' ') : 'Failed to start impersonation.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>Every user account across every tenant on the platform.</p>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="search-input-wrap">
          <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
            <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m17 17-3.8-3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            className="input"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: 200 }} value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
          <option value="">All organizations</option>
          {orgOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <select className="input" style={{ width: 150 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select className="input" style={{ width: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Invited">Invited</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {!users ? (
          <div className="state-block">
            <div className="spinner" />
            <p>Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="state-block">
            <h3>No users found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Organization</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: u.avatarColor,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {u.initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {u.fullName}
                            {isSelf ? <span className="row-sub"> (you)</span> : null}
                          </div>
                          <div className="row-sub">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Link to={`/organizations/${u.organizationId}`} className="row-link">
                        {u.organizationName}
                      </Link>
                      <div className="row-sub">{u.organizationSlug}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {u.roles.map((r) => (
                          <span key={r} className="badge badge-neutral">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[u.status]}`}>{u.status}</span>
                    </td>
                    <td className="row-sub">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={isSelf}
                          onClick={() => setEditingRoles(u)}
                          title={isSelf ? "You can't change your own roles" : ''}
                        >
                          Roles
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={busyId === u.id}
                          onClick={() => void resetPassword(u)}
                        >
                          Reset password
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={busyId === u.id || isSelf || !u.isActive || u.roles.includes('SuperAdmin')}
                          onClick={() => void impersonate(u)}
                          title={
                            isSelf
                              ? "You can't impersonate yourself"
                              : u.roles.includes('SuperAdmin')
                                ? 'SuperAdmin users cannot be impersonated'
                                : !u.isActive
                                  ? 'Inactive users cannot be impersonated'
                                  : `Open a tenant session as ${u.fullName}`
                          }
                        >
                          Impersonate
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                          disabled={busyId === u.id || (isSelf && u.isActive)}
                          onClick={() => void toggleActive(u)}
                          title={isSelf && u.isActive ? "You can't deactivate your own account" : ''}
                        >
                          {busyId === u.id ? '…' : u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editingRoles ? (
        <RolesModal
          user={editingRoles}
          onClose={() => setEditingRoles(null)}
          onSaved={(updated) => {
            setUsers((prev) => prev?.map((u) => (u.id === updated.id ? updated : u)) ?? null);
            setEditingRoles(null);
          }}
        />
      ) : null}

      {resetResult ? (
        <ResetPasswordResult user={resetResult.user} otp={resetResult.otp} onClose={() => setResetResult(null)} />
      ) : null}
    </div>
  );
}
