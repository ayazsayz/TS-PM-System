import { useCallback, useEffect, useState } from 'react';
import { Badge, Card, Icon, PageContainer, type Tone } from '@/components';
import { ApiError } from '@/lib/apiClient';
import {
  approvalsService,
  type Approval,
  type ApprovalHistory,
  type ApprovalStatus,
} from '@/services/workspaceService';
import { useUiStore } from '@/store/useUiStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import styles from './Approvals.module.css';

const GRID = '40px 1.6fr 1fr 90px 90px 110px 120px 190px';

const statusTone: Record<ApprovalStatus, Tone> = {
  Pending: 'amber',
  Approved: 'green',
  Rejected: 'red',
};

const historyDot = (action: string) =>
  action.includes('approved')
    ? 'var(--green)'
    : action.includes('rejected')
      ? 'var(--red)'
      : action.includes('escalat')
        ? 'var(--amber)'
        : 'var(--border2)';

const fmt = (n: number) => String(Number(n.toFixed(2)));

export default function ApprovalsPage() {
  const toast = useUiStore((s) => s.showToast);
  const refreshApprovals = useWorkspaceStore((s) => s.refreshApprovals);

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [history, setHistory] = useState<ApprovalHistory[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, hist] = await Promise.all([approvalsService.list(), approvalsService.history()]);
      setApprovals(list);
      setHistory(hist);
      setSel(new Set());
      void refreshApprovals();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load approvals.');
    } finally {
      setLoading(false);
    }
  }, [refreshApprovals]);

  useEffect(() => {
    void load();
  }, [load]);

  const fail = (err: unknown) =>
    toast(err instanceof ApiError ? err.message : 'Something went wrong.');

  const decide = async (a: Approval, approve: boolean) => {
    try {
      if (approve) await approvalsService.approve(a.id);
      else await approvalsService.reject(a.id, null);
      toast(approve ? `${a.name}’s timesheet approved` : `${a.name}’s timesheet returned`);
      void load();
    } catch (err) {
      fail(err);
    }
  };

  const bulkApprove = async () => {
    try {
      const { approved } = await approvalsService.bulkApprove([...sel]);
      toast(`${approved} timesheet${approved === 1 ? '' : 's'} approved`);
      void load();
    } catch (err) {
      fail(err);
    }
  };

  const toggleSel = (id: string) =>
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pending = approvals.filter((a) => a.isPending);
  const pendingHours = pending.reduce((t, a) => t + a.hours, 0);

  return (
    <PageContainer>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Timesheet approvals
        </h1>
        <div style={{ fontSize: 13.5, color: 'var(--text3)' }}>
          {pending.length > 0 ? (
            <>
              <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{pending.length} pending</span> ·{' '}
              {fmt(pendingHours)}h awaiting review
            </>
          ) : (
            'Nothing awaiting your review'
          )}
        </div>
      </div>

      {sel.size > 0 && (
        <div
          className="animate-pop-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent)',
            borderRadius: 11,
            padding: '10px 16px',
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--accent-text)' }}>
            {sel.size} selected
          </span>
          <button
            onClick={bulkApprove}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Approve selected
          </button>
          <button
            onClick={() => setSel(new Set())}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: 'var(--text2)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      )}

      <Card pad={false} style={{ overflow: 'hidden', marginBottom: 14 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            alignItems: 'center',
            background: 'var(--surface2)',
            borderBottom: '1px solid var(--border)',
            padding: '0 12px',
          }}
        >
          <div />
          {['EMPLOYEE', 'WEEK', 'HOURS', 'BILLABLE', 'STATUS', 'SUBMITTED', 'ACTIONS'].map((h, i) => (
            <div
              key={h}
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--text3)',
                padding: '11px 8px',
                textAlign: i === 2 || i === 3 || i === 6 ? 'right' : 'left',
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {loading && <div className={styles.empty}>Loading…</div>}

        {!loading && error && (
          <div className={styles.empty} style={{ color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {!loading && !error && approvals.length === 0 && (
          <div style={{ padding: '44px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>
              No timesheets submitted yet
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>
              Submitted weeks from your team will appear here for review.
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          approvals.map((a) => {
            const checked = sel.has(a.id);
            return (
              <div
                key={a.id}
                className={styles.row}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border)',
                  padding: '6px 12px',
                  background: checked ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                <div
                  className={styles.checkbox}
                  onClick={() => a.isPending && toggleSel(a.id)}
                  style={{
                    border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border2)'}`,
                    background: checked ? 'var(--accent)' : 'transparent',
                    opacity: a.isPending ? 1 : 0.3,
                    cursor: a.isPending ? 'pointer' : 'default',
                  }}
                >
                  {checked && <Icon name="check" size={9} strokeWidth={2.8} style={{ color: '#fff' }} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', minWidth: 0 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 99,
                      background: a.avatarColor,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {a.initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{a.department}</div>
                  </div>
                </div>

                <div className="tnum" style={{ fontSize: 13, color: 'var(--text2)', padding: '0 8px' }}>
                  {a.week}
                </div>

                <div style={{ padding: '0 8px', textAlign: 'right' }}>
                  <div className="tnum" style={{ fontSize: 13.5, fontWeight: 700 }}>
                    {fmt(a.hours)}h
                  </div>
                  {a.flag && (
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--amber)' }}>{a.flag}</div>
                  )}
                </div>

                <div
                  className="tnum"
                  style={{ fontSize: 13, fontWeight: 600, padding: '0 8px', textAlign: 'right', color: 'var(--text2)' }}
                >
                  {a.billablePercent}%
                </div>

                <div style={{ padding: '0 8px' }}>
                  <Badge tone={statusTone[a.status]}>{a.status}</Badge>
                </div>

                <div style={{ fontSize: 12.5, color: 'var(--text3)', padding: '0 8px' }}>
                  {a.submitted ?? '—'}
                </div>

                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', padding: '0 4px' }}>
                  {a.isPending && (
                    <>
                      <button
                        className={`${styles.actionBtn} ${styles.approve}`}
                        onClick={() => decide(a, true)}
                      >
                        Approve
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.reject}`}
                        onClick={() => decide(a, false)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
      </Card>

      {/* AUDIT TRAIL */}
      <Card>
        <div style={{ fontSize: 14.5, fontWeight: 650, marginBottom: 16 }}>Approval history · audit trail</div>
        {history.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>No approval activity yet.</div>
        )}
        {history.map((h, i) => (
          <div key={i} style={{ display: 'flex', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{ width: 10, height: 10, borderRadius: 99, background: historyDot(h.action), marginTop: 4 }}
              />
              {i < history.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)' }} />}
            </div>
            <div style={{ paddingBottom: i < history.length - 1 ? 18 : 0 }}>
              <div style={{ fontSize: 13 }}>{h.message}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 2 }}>{h.timestamp}</div>
            </div>
          </div>
        ))}
      </Card>
    </PageContainer>
  );
}
