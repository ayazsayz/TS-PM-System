import { useEffect, useMemo, useState } from 'react';
import { auditService, type AuditLogDto } from '@/services/auditService';
import { organizationsService, type OrgDto } from '@/services/organizationsService';
import { ApiError } from '@/lib/apiClient';
import { toast } from '@/store/useToastStore';

function badgeClassFor(action: string): string {
  const [category] = action.split('.');
  if (category === 'superadmin') {
    // superadmin.x.y — pick tone based on verb (last segment)
    const verb = action.split('.').pop() ?? '';
    if (['create', 'assign', 'activate', 'start'].includes(verb)) return 'badge badge-success';
    if (['suspend', 'deactivate', 'cancel', 'reset'].includes(verb)) return 'badge badge-warning';
    if (['impersonate'].includes(verb)) return 'badge badge-info';
    return 'badge badge-neutral';
  }
  return 'badge badge-neutral';
}

function toIsoOrUndefined(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogDto[] | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [orgs, setOrgs] = useState<OrgDto[]>([]);

  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    try {
      const data = await auditService.list({
        search: search.trim() || undefined,
        organizationId: orgFilter || undefined,
        action: actionFilter || undefined,
        from: toIsoOrUndefined(from),
        to: toIsoOrUndefined(to),
        take: 200,
      });
      setEntries(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.allMessages.join(' ') : 'Failed to load audit log.');
      setEntries([]);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const [a, o] = await Promise.all([auditService.listActions(), organizationsService.list()]);
        setActions(a);
        setOrgs(o);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgFilter, actionFilter, from, to]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const orgOptions = useMemo(() => [...orgs].sort((a, b) => a.name.localeCompare(b.name)), [orgs]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Audit log</h1>
          <p>Every SuperAdmin action taken across the platform. Newest first.</p>
        </div>
        <div>
          <button type="button" className="btn btn-secondary" onClick={() => void load()}>
            Refresh
          </button>
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
            placeholder="Search message or action…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: 220 }} value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
          <option value="">All organizations</option>
          {orgOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <select
          className="input"
          style={{ width: 220 }}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="datetime-local"
          style={{ width: 200 }}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          title="From"
        />
        <input
          className="input"
          type="datetime-local"
          style={{ width: 200 }}
          value={to}
          onChange={(e) => setTo(e.target.value)}
          title="To"
        />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {!entries ? (
          <div className="state-block">
            <div className="spinner" />
            <p>Loading audit log…</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="state-block">
            <h3>No entries</h3>
            <p>No audit entries match the current filters.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 180 }}>When</th>
                <th style={{ width: 220 }}>Actor</th>
                <th style={{ width: 200 }}>Organization</th>
                <th style={{ width: 220 }}>Action</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="row-sub">{new Date(e.timestamp).toLocaleString()}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{e.actorName}</div>
                    <div className="row-sub">{e.actorEmail}</div>
                  </td>
                  <td>{e.organizationName}</td>
                  <td>
                    <span className={badgeClassFor(e.action)}>{e.action}</span>
                  </td>
                  <td>{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
