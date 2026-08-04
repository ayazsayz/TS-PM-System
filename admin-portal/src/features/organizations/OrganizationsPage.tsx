import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { organizationsService, type OrgDto } from '@/services/organizationsService';
import { Modal } from '@/components/Modal';
import { toast } from '@/store/useToastStore';
import { ApiError } from '@/lib/apiClient';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function CreateOrgModal({ onClose, onCreated }: { onClose: () => void; onCreated: (org: OrgDto) => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const org = await organizationsService.create({ name: name.trim(), slug: (slug || slugify(name)).trim() });
      toast.success(`${org.name} was created.`);
      onCreated(org);
    } catch (err) {
      setError(err instanceof ApiError ? err.allMessages.join(' ') : 'Failed to create organization.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Create organization" subtitle="Add a new tenant to the platform." onClose={onClose}>
      {error ? <div className="banner-error">{error}</div> : null}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="org-name">Organization name</label>
          <input
            id="org-name"
            className="input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="org-slug">Slug</label>
          <input
            id="org-slug"
            className="input"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugTouched(true);
            }}
            required
          />
          <span className="field-hint">Used in URLs and API references. Lowercase letters, numbers and dashes only.</span>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create organization'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function OrganizationsPage() {
  const [orgs, setOrgs] = useState<OrgDto[] | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await organizationsService.list();
      setOrgs(data);
    } catch (e) {
      navigate('/login');
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!orgs) return [];
    return orgs.filter((o) => {
      const matchesSearch =
        !search.trim() ||
        o.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        o.slug.toLowerCase().includes(search.trim().toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? o.isActive : !o.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [orgs, search, statusFilter]);

  const toggleActive = async (org: OrgDto) => {
    setBusyId(org.id);
    try {
      if (org.isActive) {
        await organizationsService.suspend(org.id);
        toast.success(`${org.name} has been suspended.`);
      } else {
        await organizationsService.activate(org.id);
        toast.success(`${org.name} has been reactivated.`);
      }
      setOrgs((prev) => prev?.map((o) => (o.id === org.id ? { ...o, isActive: !o.isActive } : o)) ?? null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.allMessages.join(' ') : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Organizations</h1>
          <p>Manage tenants provisioned on the platform.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Create organization
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-input-wrap">
          <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
            <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="m17 17-3.8-3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            className="input"
            placeholder="Search by name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {!orgs ? (
          <div className="state-block">
            <div className="spinner" />
            <p>Loading organizations…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="state-block">
            <h3>No organizations found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/organizations/${o.id}`} className="row-link">
                      {o.name}
                    </Link>
                  </td>
                  <td className="row-sub">{o.slug}</td>
                  <td>
                    <span className={`badge ${o.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {o.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="row-sub">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="row-actions">
                      <Link to={`/organizations/${o.id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                      <button
                        type="button"
                        className={`btn btn-sm ${o.isActive ? 'btn-danger' : 'btn-secondary'}`}
                        disabled={busyId === o.id}
                        onClick={() => toggleActive(o)}
                      >
                        {busyId === o.id ? '…' : o.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate ? (
        <CreateOrgModal
          onClose={() => setShowCreate(false)}
          onCreated={(org) => {
            setOrgs((prev) => (prev ? [org, ...prev] : [org]));
            setShowCreate(false);
          }}
        />
      ) : null}
    </div>
  );
}
