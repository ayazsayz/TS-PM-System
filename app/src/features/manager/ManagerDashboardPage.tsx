import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardHeader, KpiCard, PageContainer } from '@/components';
import { avatarColors } from '@/lib/mockData';
import { fmtH } from '@/lib/calc';
import { selectPendingCount, useTimesheetStore } from '@/store/useTimesheetStore';
import { useUiStore } from '@/store/useUiStore';

const utilization: [string, number, string][] = [
  ['Sarah Chen', 98, 'var(--green)'],
  ['Priya Sharma', 95, 'var(--green)'],
  ['Alex Morgan', 92, 'var(--green)'],
  ['Lena Fischer', 88, 'var(--green)'],
  ['Diego Ruiz', 76, 'var(--amber)'],
  ['Marcus Webb', 71, 'var(--amber)'],
  ['Tom Okafor', 54, 'var(--red)'],
];

const health: [string, string, string, string, 'red' | 'amber' | 'green', string][] = [
  ['#B54708', 'Atlas Mobile Banking', '900h / 1010h', '109%', 'red', 'Over budget'],
  ['#C11574', 'Zephyr Portal Redesign', '480h / 495h', '95%', 'red', 'Delayed'],
  ['#0E9384', 'Helios ERP Rollout', '2400h / 2310h', '95%', 'amber', 'At risk'],
  ['#4757E6', 'Aurora Cloud Migration', '1200h / 860h', '68%', 'green', 'On track'],
];

const missing = [
  { name: 'Tom Okafor', dept: 'Data · 2 weeks overdue', initials: 'TO', sev: 'var(--red)' },
  { name: 'Amy Park', dept: 'Engineering · due today', initials: 'AP', sev: 'var(--amber)' },
  { name: 'Marcus Webb', dept: 'Engineering · this week', initials: 'MW', sev: 'var(--amber)' },
];

const performers: [string, string, string][] = [
  ['1', 'Sarah Chen', 'SC'],
  ['2', 'Priya Sharma', 'PS'],
  ['3', 'Alex Morgan', 'AM'],
];
const performerUtil = ['98% util', '95% util', '92% util'];

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const pending = useTimesheetStore(selectPendingCount);
  const approvals = useTimesheetStore((s) => s.approvals);
  const toast = useUiStore((s) => s.showToast);
  const pendingHours = fmtH(approvals.filter((a) => a.status === 'Pending').reduce((t, a) => t + a.hours, 0));

  return (
    <PageContainer>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 22,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Team overview
          </h1>
          <div style={{ fontSize: 13.5, color: 'var(--text3)' }}>Delivery · 8 people · Week 27</div>
        </div>
        <Button variant="primary" onClick={() => navigate('/approvals')}>
          Review approvals ({pending})
        </Button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
        <KpiCard
          label="Pending approvals"
          value={pending}
          valueColor="var(--amber)"
          hoverable
          onClick={() => navigate('/approvals')}
          footer={<div style={{ fontSize: 12, color: 'var(--text3)' }}>{pendingHours}h awaiting review</div>}
        />
        <KpiCard
          label="Missing timesheets"
          value="3"
          valueColor="var(--red)"
          footer={<div style={{ fontSize: 12, color: 'var(--text3)' }}>1 escalated · 2 due today</div>}
        />
        <KpiCard
          label="Team utilization"
          value="87%"
          footer={<div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>▲ 3% vs last week</div>}
        />
        <KpiCard
          label="Projects at risk"
          value="3"
          valueColor="var(--red)"
          hoverable
          onClick={() => navigate('/projects')}
          footer={<div style={{ fontSize: 12, color: 'var(--text3)' }}>1 over budget · 1 delayed · 1 near estimate</div>}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, alignItems: 'start' }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <CardHeader
              title="Team utilization · this week"
              action={
                <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--text3)' }}>
                  <LegendDot color="var(--green)" label="80–100%" />
                  <LegendDot color="var(--amber)" label="60–80%" />
                  <LegendDot color="var(--red)" label="<60%" />
                </div>
              }
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {utilization.map(([name, val, color]) => (
                <div key={name} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 46px', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                  <div style={{ height: 9, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden' }}>
                    <div style={{ width: `${val}%`, height: '100%', background: color, borderRadius: 99 }} />
                  </div>
                  <div
                    className="tnum"
                    style={{ fontSize: 12.5, fontWeight: 700, textAlign: 'right', color: val < 60 ? 'var(--red)' : 'var(--text)' }}
                  >
                    {val}%
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Project health"
              action={
                <div onClick={() => navigate('/projects')} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', cursor: 'pointer' }}>
                  All projects →
                </div>
              }
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 110px', padding: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
              <div>PROJECT</div>
              <div style={{ textAlign: 'right' }}>EST / ACTUAL</div>
              <div style={{ textAlign: 'right' }}>BUDGET USED</div>
              <div style={{ textAlign: 'right' }}>STATUS</div>
            </div>
            {health.map(([color, name, est, used, tone, label], i) => (
              <div key={name} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 110px', alignItems: 'center', padding: '11px 8px', borderBottom: i < health.length - 1 ? '1px solid var(--border)' : undefined, fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: color }} />
                  {name}
                </div>
                <div className="tnum" style={{ textAlign: 'right', color: tone === 'green' ? 'var(--text)' : `var(--${tone})`, fontWeight: tone === 'green' ? 400 : 600 }}>
                  {est}
                </div>
                <div className="tnum" style={{ textAlign: 'right', color: tone === 'red' ? 'var(--red)' : 'var(--text)', fontWeight: tone === 'red' ? 600 : 400 }}>
                  {used}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge tone={tone}>{label}</Badge>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <div style={{ fontSize: 14.5, fontWeight: 650, marginBottom: 12 }}>Missing timesheets</div>
            {missing.map((m) => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 30, height: 30, borderRadius: 99, background: avatarColors[m.initials] || '#475467', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {m.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: m.sev, fontWeight: 600 }}>{m.dept}</div>
                </div>
                <button
                  onClick={() => toast(`Reminder sent to ${m.name}`)}
                  style={{ padding: '6px 11px', borderRadius: 7, border: '1px solid var(--border2)', background: 'var(--surface)', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--text2)', whiteSpace: 'nowrap' }}
                >
                  Remind
                </button>
              </div>
            ))}
            <div style={{ fontSize: 11.5, color: 'var(--text3)', paddingTop: 10 }}>
              Auto-reminder fires Friday 6 PM, then escalates to PM → Dept Manager.
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 14.5, fontWeight: 650, marginBottom: 12 }}>Top performers · June</div>
            {performers.map(([rank, name, initials], i) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < performers.length - 1 ? '1px solid var(--border)' : undefined }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', width: 16 }}>{rank}</span>
                <div style={{ width: 28, height: 28, borderRadius: 99, background: avatarColors[initials] || '#475467', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700 }}>
                  {initials}
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{name}</div>
                <span className="tnum" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green)' }}>
                  {performerUtil[i]}
                </span>
              </div>
            ))}
          </Card>

          <Card>
            <div style={{ fontSize: 14.5, fontWeight: 650, marginBottom: 12 }}>Recent activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12.5, color: 'var(--text2)' }}>
              <Activity name="Priya Sharma" text=" submitted 42h — flagged +2h overtime" meta="18 min ago" />
              <Activity name="Atlas Mobile Banking" text=" crossed 100% of estimated hours" meta="25 min ago" />
              <Activity name="Diego Ruiz" text=" submitted timesheet for Jun 22 – 28" meta="2 h ago" />
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 3, background: color }} />
      {label}
    </span>
  );
}

function Activity({ name, text, meta }: { name: string; text: string; meta: string }) {
  return (
    <div>
      <strong style={{ color: 'var(--text)' }}>{name}</strong>
      {text}
      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{meta}</div>
    </div>
  );
}
