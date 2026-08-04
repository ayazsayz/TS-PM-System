import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { organizationsService, type OrgDto } from '@/services/organizationsService';
import { useAuthStore } from '@/store/useAuthStore';

function StatCard({ label, value, tone }: { label: string; value: string | number; tone?: 'success' | 'danger' }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row-sub" style={{ marginBottom: 8 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: tone === 'success' ? 'var(--color-success)' : tone === 'danger' ? 'var(--color-danger)' : 'var(--color-text)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [orgs, setOrgs] = useState<OrgDto[] | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setOrgs(await organizationsService.list());
      } catch {
        setOrgs([]);
      }
    })();
  }, []);

  const total = orgs?.length ?? 0;
  const active = orgs?.filter((o) => o.isActive).length ?? 0;
  const suspended = total - active;
  const recent = [...(orgs ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</h1>
          <p>Here&apos;s what&apos;s happening across the platform.</p>
        </div>
        <Link to="/organizations" className="btn btn-primary">
          Manage organizations
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total organizations" value={orgs ? total : '—'} />
        <StatCard label="Active" value={orgs ? active : '—'} tone="success" />
        <StatCard label="Suspended" value={orgs ? suspended : '—'} tone="danger" />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: 14 }}>
          Recently added organizations
        </div>
        {!orgs ? (
          <div className="state-block">
            <div className="spinner" />
            <p>Loading…</p>
          </div>
        ) : recent.length === 0 ? (
          <div className="state-block">
            <h3>No organizations yet</h3>
            <p>Create your first tenant to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
