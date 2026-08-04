import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionsService, type SubscriptionDto } from '@/services/subscriptionsService';

const STATUS_BADGE: Record<SubscriptionDto['status'], string> = {
  Active: 'badge-success',
  Trialing: 'badge-info',
  PastDue: 'badge-warning',
  Suspended: 'badge-danger',
  Cancelled: 'badge-neutral',
};

export function SubscriptionsPage() {
  const [subs, setSubs] = useState<SubscriptionDto[] | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void (async () => setSubs(await subscriptionsService.list()))();
  }, []);

  const filtered = useMemo(() => {
    if (!subs) return [];
    const q = search.trim().toLowerCase();
    if (!q) return subs;
    return subs.filter(
      (s) => s.organizationName.toLowerCase().includes(q) || s.planName.toLowerCase().includes(q),
    );
  }, [subs, search]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Subscriptions</h1>
          <p>Cross-tenant view of every active plan assignment.</p>
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
            placeholder="Search by organization or plan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {!subs ? (
          <div className="state-block">
            <div className="spinner" />
            <p>Loading subscriptions…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="state-block">
            <h3>No subscriptions found</h3>
            <p>Assign a plan to an organization to see it listed here.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Billing cycle</th>
                <th>Period ends</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link to={`/organizations/${s.organizationId}`} className="row-link">
                      {s.organizationName}
                    </Link>
                  </td>
                  <td className="row-sub">
                    {s.planName} ({s.planCode})
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[s.status]}`}>{s.status}</span>
                  </td>
                  <td className="row-sub">{s.billingCycle}</td>
                  <td className="row-sub">{s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : '—'}</td>
                  <td>
                    <div className="row-actions">
                      <Link to={`/organizations/${s.organizationId}`} className="btn btn-secondary btn-sm">
                        Manage
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
