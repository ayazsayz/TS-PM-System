import { Badge, Card, Icon, PageContainer } from '@/components';
import { avatarColors } from '@/lib/mockData';
import { approvalTone, fmtH } from '@/lib/calc';
import { useTimesheetStore } from '@/store/useTimesheetStore';
import styles from './Approvals.module.css';

const GRID = '40px 1.6fr 1fr 90px 90px 110px 120px 190px';

export default function ApprovalsPage() {
  const { approvals, sel, toggleSel, clearSel, bulkApprove, decide } = useTimesheetStore();

  const pending = approvals.filter((a) => a.status === 'Pending');
  const pendingHours = fmtH(pending.reduce((t, a) => t + a.hours, 0));
  const selIds = Object.keys(sel).filter((id) => sel[id]);

  return (
    <PageContainer>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Timesheet approvals
        </h1>
        <div style={{ fontSize: 13.5, color: 'var(--text3)' }}>
          <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{pending.length} pending</span> ·{' '}
          {pendingHours}h awaiting review · Week of Jun 22 – 28
        </div>
      </div>

      {/* BULK BAR */}
      {selIds.length > 0 && (
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
            {selIds.length} selected
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
            onClick={clearSel}
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

      {/* TABLE */}
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

        {approvals.map((a) => {
          const checked = !!sel[a.id];
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
                onClick={() => toggleSel(a.id)}
                style={{
                  border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border2)'}`,
                  background: checked ? 'var(--accent)' : 'transparent',
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
                    background: avatarColors[a.initials] || '#475467',
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
                  <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{a.dept}</div>
                </div>
              </div>

              <div className="tnum" style={{ fontSize: 13, color: 'var(--text2)', padding: '0 8px' }}>
                {a.week}
              </div>

              <div style={{ padding: '0 8px', textAlign: 'right' }}>
                <div className="tnum" style={{ fontSize: 13.5, fontWeight: 700 }}>
                  {fmtH(a.hours)}h
                </div>
                {a.flag && <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--amber)' }}>{a.flag}</div>}
              </div>

              <div className="tnum" style={{ fontSize: 13, fontWeight: 600, padding: '0 8px', textAlign: 'right', color: 'var(--text2)' }}>
                {a.billable}%
              </div>

              <div style={{ padding: '0 8px' }}>
                <Badge tone={approvalTone(a.status)}>{a.status}</Badge>
              </div>

              <div style={{ fontSize: 12.5, color: 'var(--text3)', padding: '0 8px' }}>{a.submitted}</div>

              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', padding: '0 4px' }}>
                {a.status === 'Pending' && (
                  <>
                    <button className={`${styles.actionBtn} ${styles.approve}`} onClick={() => decide(a.id, 'Approved')}>
                      Approve
                    </button>
                    <button className={`${styles.actionBtn} ${styles.reject}`} onClick={() => decide(a.id, 'Rejected')}>
                      Reject
                    </button>
                  </>
                )}
                <button className={styles.viewBtn}>View</button>
              </div>
            </div>
          );
        })}
      </Card>

      {/* HISTORY */}
      <Card>
        <div style={{ fontSize: 14.5, fontWeight: 650, marginBottom: 16 }}>Approval history · audit trail</div>
        <TimelineItem color="var(--green)" line>
          <div style={{ fontSize: 13 }}>
            <strong>You approved</strong> Lena Fischer's timesheet — Jun 22 – 28 · 40h
          </div>
          <Meta>Today, 8:47 AM</Meta>
        </TimelineItem>
        <TimelineItem color="var(--red)" line>
          <div style={{ fontSize: 13 }}>
            <strong>You rejected</strong> Tom Okafor's timesheet — Jun 15 – 21 · "5h missing on Thursday, please
            complete and resubmit."
          </div>
          <Meta>Yesterday, 4:12 PM</Meta>
        </TimelineItem>
        <TimelineItem color="var(--amber)" line>
          <div style={{ fontSize: 13 }}>
            <strong>System escalation</strong> — Tom Okafor's missing timesheet escalated to Department Manager
          </div>
          <Meta>Yesterday, 9:00 AM · Rule: Friday 6 PM deadline</Meta>
        </TimelineItem>
        <TimelineItem color="var(--border2)">
          <div style={{ fontSize: 13 }}>
            <strong>Reminder sent</strong> to 3 employees with unsubmitted timesheets
          </div>
          <Meta>Fri Jun 26, 6:00 PM · Automatic</Meta>
        </TimelineItem>
      </Card>
    </PageContainer>
  );
}

function TimelineItem({ color, line, children }: { color: string; line?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 10, height: 10, borderRadius: 99, background: color, marginTop: 4 }} />
        {line && <div style={{ width: 2, flex: 1, background: 'var(--border)' }} />}
      </div>
      <div style={{ paddingBottom: line ? 18 : 0 }}>{children}</div>
    </div>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 2 }}>{children}</div>;
}
