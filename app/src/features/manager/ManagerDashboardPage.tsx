import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardHeader, KpiCard, PageContainer, type Tone } from '@/components';
import { ApiError } from '@/lib/apiClient';
import { projectsService, type Project } from '@/services/projectsService';
import {
  dashboardService,
  teamService,
  type ManagerDashboard,
  type MissingTimesheet,
  type TopPerformer,
  type Utilization,
} from '@/services/workspaceService';

const fmt = (n: number) => String(Number(n.toFixed(2)));

const utilColor = (pct: number) =>
  pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';

const healthTone: Record<string, Tone> = {
  'On track': 'green',
  'At risk': 'amber',
  'Over budget': 'red',
  Delayed: 'red',
  Completed: 'neutral',
};

export default function ManagerDashboardPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<ManagerDashboard | null>(null);
  const [utilization, setUtilization] = useState<Utilization[]>([]);
  const [missing, setMissing] = useState<MissingTimesheet[]>([]);
  const [performers, setPerformers] = useState<TopPerformer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, u, m, p, projs] = await Promise.all([
        dashboardService.manager(),
        teamService.utilization(),
        teamService.missing(),
        teamService.topPerformers(),
        projectsService.list(),
      ]);
      setData(d);
      setUtilization(u);
      setMissing(m);
      setPerformers(p);
      setProjects(projs);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the team overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Loading…</div>
        </Card>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Card>
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>{error}</div>
        </Card>
      </PageContainer>
    );
  }

  const d = data!;

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
          <div style={{ fontSize: 13.5, color: 'var(--text3)' }}>
            {utilization.length} {utilization.length === 1 ? 'person' : 'people'}
          </div>
        </div>
        {d.pendingApprovals > 0 && (
          <Button variant="primary" onClick={() => navigate('/approvals')}>
            Review approvals ({d.pendingApprovals})
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
        <KpiCard
          label="Pending approvals"
          value={d.pendingApprovals}
          valueColor={d.pendingApprovals > 0 ? 'var(--amber)' : undefined}
          hoverable
          onClick={() => navigate('/approvals')}
          footer={
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{fmt(d.pendingHours)}h awaiting review</div>
          }
        />
        <KpiCard
          label="Missing timesheets"
          value={d.missingTimesheets}
          valueColor={d.missingTimesheets > 0 ? 'var(--red)' : undefined}
          footer={<div style={{ fontSize: 12, color: 'var(--text3)' }}>for the latest submitted week</div>}
        />
        <KpiCard
          label="Team utilization"
          value={`${d.teamUtilizationPercent}%`}
          footer={<div style={{ fontSize: 12, color: 'var(--text3)' }}>average of logged weeks</div>}
        />
        <KpiCard
          label="Projects at risk"
          value={d.projectsAtRisk}
          valueColor={d.projectsAtRisk > 0 ? 'var(--red)' : undefined}
          hoverable
          onClick={() => navigate('/projects')}
          footer={<div style={{ fontSize: 12, color: 'var(--text3)' }}>at risk, delayed or over budget</div>}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* UTILIZATION */}
          <Card>
            <CardHeader
              title="Team utilization"
              action={
                <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--text3)' }}>
                  <Legend color="var(--green)" label="80–100%" />
                  <Legend color="var(--amber)" label="60–80%" />
                  <Legend color="var(--red)" label="<60%" />
                </div>
              }
            />
            {utilization.length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
                No team members yet.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {utilization.map((u) => (
                <div
                  key={u.userId}
                  style={{ display: 'grid', gridTemplateColumns: '150px 1fr 46px', alignItems: 'center', gap: 12 }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                  <div style={{ height: 9, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, u.utilizationPercent)}%`,
                        height: '100%',
                        background: utilColor(u.utilizationPercent),
                        borderRadius: 99,
                      }}
                    />
                  </div>
                  <div
                    className="tnum"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      textAlign: 'right',
                      color: u.utilizationPercent < 60 ? 'var(--red)' : 'var(--text)',
                    }}
                  >
                    {u.utilizationPercent}%
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* PROJECT HEALTH */}
          <Card>
            <CardHeader
              title="Project health"
              action={
                <div
                  onClick={() => navigate('/projects')}
                  style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', cursor: 'pointer' }}
                >
                  All projects →
                </div>
              }
            />
            {projects.length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
                No projects yet.
              </div>
            )}
            {projects.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 110px',
                  padding: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: 'var(--text3)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>PROJECT</div>
                <div style={{ textAlign: 'right' }}>EST / ACTUAL</div>
                <div style={{ textAlign: 'right' }}>BUDGET USED</div>
                <div style={{ textAlign: 'right' }}>STATUS</div>
              </div>
            )}
            {projects.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 110px',
                  alignItems: 'center',
                  padding: '11px 8px',
                  borderBottom: i < projects.length - 1 ? '1px solid var(--border)' : undefined,
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: p.colorHex }} />
                  {p.name}
                </div>
                <div className="tnum" style={{ textAlign: 'right' }}>
                  {p.estimatedHours}h / {fmt(p.actualHours)}h
                </div>
                <div
                  className="tnum"
                  style={{
                    textAlign: 'right',
                    color: p.budgetPercent > 100 ? 'var(--red)' : 'var(--text)',
                    fontWeight: p.budgetPercent > 100 ? 600 : 400,
                  }}
                >
                  {p.budgetPercent}%
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge tone={healthTone[p.health] ?? 'neutral'}>{p.health}</Badge>
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <div style={{ fontSize: 14.5, fontWeight: 650, marginBottom: 12 }}>Missing timesheets</div>
            {missing.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Everyone is up to date. 🎉</div>
            )}
            {missing.map((m, i) => (
              <div
                key={m.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 0',
                  borderBottom: i < missing.length - 1 ? '1px solid var(--border)' : undefined,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 99,
                    background: m.avatarColor,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {m.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{m.department || '—'}</div>
                </div>
              </div>
            ))}
          </Card>

          <Card>
            <div style={{ fontSize: 14.5, fontWeight: 650, marginBottom: 12 }}>Top performers</div>
            {performers.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>No data yet.</div>
            )}
            {performers.map((p, i) => (
              <div
                key={p.rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 0',
                  borderBottom: i < performers.length - 1 ? '1px solid var(--border)' : undefined,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', width: 16 }}>{p.rank}</span>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 99,
                    background: p.avatarColor,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}
                >
                  {p.initials}
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                <span
                  className="tnum"
                  style={{ fontSize: 12.5, fontWeight: 700, color: utilColor(p.utilizationPercent) }}
                >
                  {p.utilizationPercent}% util
                </span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 3, background: color }} />
      {label}
    </span>
  );
}
