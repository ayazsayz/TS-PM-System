import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardHeader, Icon, KpiCard, PageContainer, ProgressBar, Ring } from '@/components';
import { ApiError } from '@/lib/apiClient';
import { projectsService, type MyProject } from '@/services/projectsService';
import {
  dashboardService,
  tasksService,
  type EmployeeDashboard,
  type Task,
} from '@/services/workspaceService';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';

const fmt = (n: number) => String(Number(n.toFixed(2)));

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const toast = useUiStore((s) => s.showToast);

  const [data, setData] = useState<EmployeeDashboard | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, t, p] = await Promise.all([
        dashboardService.employee(),
        tasksService.list(),
        projectsService.mine(),
      ]);
      setData(d);
      setTasks(t);
      setProjects(p);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleTask = async (id: string) => {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t))); // optimistic
    try {
      const updated = await tasksService.toggle(id);
      setTasks((ts) => ts.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setTasks(prev);
      toast(err instanceof ApiError ? err.message : 'Could not update the task.');
    }
  };

  const firstName = user?.fullName.split(' ')[0] ?? 'there';
  const openTasks = tasks.filter((t) => !t.done).length;

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
  const hasActivity = d.weekHours > 0;

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
            Welcome back, {firstName}
          </h1>
          <div style={{ fontSize: 13.5, color: 'var(--text3)' }}>
            {hasActivity
              ? `Your latest activity · ${new Date(d.referenceDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`
              : 'No time logged yet — start by adding an entry.'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={() => navigate('/weekly')}>
            Review week
          </Button>
          <Button variant="primary" onClick={() => navigate('/daily')}>
            <Icon name="plus" size={13} />
            Log time
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
        <KpiCard
          label="Latest day"
          value={
            <>
              {fmt(d.todayHours)}
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text3)' }}> / {d.dayTarget}h</span>
            </>
          }
          footer={
            <ProgressBar
              value={Math.min(100, (d.todayHours / d.dayTarget) * 100)}
              height={5}
              style={{ marginTop: 2 }}
            />
          }
        />
        <KpiCard
          label="This week"
          value={
            <>
              {fmt(d.weekHours)}
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text3)' }}> / {d.weekTarget}h</span>
            </>
          }
          footer={<ProgressBar value={d.weekPercent} height={5} style={{ marginTop: 2 }} />}
        />
        <KpiCard
          label="Billable ratio"
          value={`${d.billablePercent}%`}
          footer={
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              {hasActivity ? 'of hours logged this week' : 'no hours yet'}
            </div>
          }
        />
        <KpiCard
          label="Pending submission"
          value={
            <>
              {d.pendingWeeks}
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text3)' }}>
                {' '}
                {d.pendingWeeks === 1 ? 'week' : 'weeks'}
              </span>
            </>
          }
          valueColor={d.pendingWeeks > 0 ? 'var(--amber)' : undefined}
          footer={
            d.pendingWeeks > 0 ? (
              <div
                onClick={() => navigate('/weekly')}
                style={{ fontSize: 12, color: 'var(--accent-text)', fontWeight: 600, cursor: 'pointer' }}
              >
                Submit now →
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>All caught up</div>
            )
          }
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.9fr 1fr', gap: 14, alignItems: 'start' }}>
        {/* LEFT — tasks */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 14.5, fontWeight: 650 }}>My tasks</div>
            <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>{openTasks} open</div>
          </div>

          {tasks.length === 0 && (
            <div style={{ padding: '30px 0', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
              No tasks yet.
            </div>
          )}

          {tasks.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 2px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                onClick={() => toggleTask(t.id)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  border: `1.5px solid ${t.done ? 'var(--accent)' : 'var(--border2)'}`,
                  background: t.done ? 'var(--accent)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {t.done && <Icon name="check" size={10} strokeWidth={2.6} style={{ color: '#fff' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 550,
                    textDecoration: t.done ? 'line-through' : 'none',
                    color: t.done ? 'var(--text3)' : 'var(--text)',
                  }}
                >
                  {t.label}
                </div>
              </div>
              {t.projectName && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: 'var(--text2)',
                    background: 'var(--surface2)',
                    borderRadius: 99,
                    padding: '3px 10px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    style={{ width: 7, height: 7, borderRadius: 99, background: t.projectColor ?? '#475467' }}
                  />
                  {t.projectName.split(' ')[0]}
                </span>
              )}
              <span
                style={{
                  fontSize: 12,
                  color: t.urgent ? 'var(--red)' : 'var(--text2)',
                  fontWeight: 600,
                  width: 72,
                  textAlign: 'right',
                }}
              >
                {t.due ?? ''}
              </span>
            </div>
          ))}
        </Card>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 14.5, fontWeight: 650, alignSelf: 'flex-start', marginBottom: 14 }}>
              Weekly progress
            </div>
            <Ring value={d.weekPercent}>
              <div className="tnum" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {d.weekPercent}%
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>of {d.weekTarget}h</div>
            </Ring>
            <div style={{ display: 'flex', gap: 18, marginTop: 16, fontSize: 12.5, color: 'var(--text2)' }}>
              <span>
                <strong className="tnum" style={{ color: 'var(--text)' }}>
                  {fmt(d.weekHours)}h
                </strong>{' '}
                logged
              </span>
              <span>
                <strong className="tnum" style={{ color: 'var(--text)' }}>
                  {fmt(Math.max(0, d.weekTarget - d.weekHours))}h
                </strong>{' '}
                remaining
              </span>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="My projects"
              action={
                <div
                  onClick={() => navigate('/projects')}
                  style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent-text)', cursor: 'pointer' }}
                >
                  All →
                </div>
              }
            />
            {projects.length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
                You’re not assigned to any projects yet.
              </div>
            )}
            {projects.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 0',
                  borderBottom: i < projects.length - 1 ? '1px solid var(--border)' : undefined,
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: 3, background: p.colorHex, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{p.client}</div>
                </div>
                <Badge tone={p.completionPct >= 90 ? 'amber' : 'green'}>{p.completionPct}%</Badge>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
