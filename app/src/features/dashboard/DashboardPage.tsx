import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardHeader, Icon, KpiCard, PageContainer, ProgressBar, Ring } from '@/components';
import { projects } from '@/lib/mockData';
import { DAY_HOURS, WEEK_HOURS, dayBarColor, fmtH, pct, sumCells, sumEntries } from '@/lib/calc';
import { useAuthStore } from '@/store/useAuthStore';
import { useTimesheetStore } from '@/store/useTimesheetStore';
import { HoursBarChart } from './HoursBarChart';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const entriesByDay = useTimesheetStore((s) => s.entriesByDay);
  const activeDay = useTimesheetStore((s) => s.activeDay);
  const weekRows = useTimesheetStore((s) => s.weekRows);
  const tasks = useTimesheetStore((s) => s.tasks);
  const toggleTask = useTimesheetStore((s) => s.toggleTask);

  const dayTotal = sumEntries(entriesByDay[activeDay] || []);
  const weekTotal = weekRows.reduce((t, r) => t + sumCells(r.hours), 0);
  const weekPct = Math.round(pct(weekTotal, WEEK_HOURS));
  const weekRemaining = Math.max(0, WEEK_HOURS - weekTotal);
  const openTasks = tasks.filter((t) => !t.done).length;

  return (
    <PageContainer>
      {/* HEADER */}
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
            Good morning, {user.name.split(' ')[0]}
          </h1>
          <div style={{ fontSize: 13.5, color: 'var(--text3)' }}>
            Friday, July 3 · Week 27 ·{' '}
            <span style={{ color: 'var(--amber)', fontWeight: 600 }}>Timesheet due today, 6 PM</span>
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

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
        <KpiCard
          label="Today"
          value={
            <>
              {fmtH(dayTotal)}
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text3)' }}> / {DAY_HOURS}h</span>
            </>
          }
          footer={
            <ProgressBar value={pct(dayTotal, DAY_HOURS)} color={dayBarColor(dayTotal)} height={5} style={{ marginTop: 2 }} />
          }
        />
        <KpiCard
          label="This week"
          value={
            <>
              {fmtH(weekTotal)}
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text3)' }}> / {WEEK_HOURS}h</span>
            </>
          }
          footer={<ProgressBar value={pct(weekTotal, WEEK_HOURS)} height={5} style={{ marginTop: 2 }} />}
        />
        <KpiCard
          label="Billable ratio"
          value="78%"
          footer={<div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>▲ 4% vs last week</div>}
        />
        <KpiCard
          label="Pending submission"
          value={
            <>
              1<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text3)' }}> week</span>
            </>
          }
          footer={
            <div
              onClick={() => navigate('/weekly')}
              style={{ fontSize: 12, color: 'var(--accent-text)', fontWeight: 600, cursor: 'pointer' }}
            >
              Submit now →
            </div>
          }
        />
      </div>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.9fr 1fr', gap: 14, alignItems: 'start' }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <CardHeader
              title="Hours this week"
              action={
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text3)' }}>
                  <Legend color="var(--accent)" label="Billable" />
                  <Legend color="var(--border2)" label="Non-billable" />
                </div>
              }
            />
            <HoursBarChart />
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 14.5, fontWeight: 650 }}>My tasks</div>
              <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>{openTasks} open</div>
            </div>
            {tasks.map((t) => {
              const proj = projects[t.p];
              return (
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
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {t.label}
                    </div>
                  </div>
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
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: proj.color }} />
                    {proj.name.split(' ')[0]}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: t.urgent ? 'var(--red)' : t.done ? 'var(--text3)' : 'var(--text2)',
                      fontWeight: 600,
                      width: 72,
                      textAlign: 'right',
                    }}
                  >
                    {t.due}
                  </span>
                </div>
              );
            })}
          </Card>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 14.5, fontWeight: 650, alignSelf: 'flex-start', marginBottom: 14 }}>
              Weekly progress
            </div>
            <Ring value={pct(weekTotal, WEEK_HOURS)}>
              <div className="tnum" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {weekPct}%
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>of {WEEK_HOURS}h</div>
            </Ring>
            <div style={{ display: 'flex', gap: 18, marginTop: 16, fontSize: 12.5, color: 'var(--text2)' }}>
              <span>
                <strong className="tnum" style={{ color: 'var(--text)' }}>
                  {fmtH(weekTotal)}h
                </strong>{' '}
                logged
              </span>
              <span>
                <strong className="tnum" style={{ color: 'var(--text)' }}>
                  {fmtH(weekRemaining)}h
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
            <ProjectRow color="#4757E6" name="Aurora Cloud Migration" meta="Nexbank · 18.5h this week" pct="72%" tone="green" />
            <ProjectRow color="#7839EE" name="Orion Data Platform" meta="MedCore Health · 12h this week" pct="38%" tone="green" />
            <ProjectRow color="#0E9384" name="Helios ERP Rollout" meta="Vertex Retail · 7h this week" pct="88%" tone="amber" last />
          </Card>

          <Card>
            <div style={{ fontSize: 14.5, fontWeight: 650, marginBottom: 10 }}>Upcoming deadlines</div>
            <Deadline mon="JUL" day="08" tone="red" name="Zephyr Portal Redesign" sub="Delayed · due in 5 days" subTone="red" />
            <Deadline mon="JUL" day="10" tone="amber" name="Atlas Mobile Banking" sub="Go-live checkpoint" />
            <Deadline mon="JUL" day="31" tone="neutral" name="Helios ERP Rollout" sub="Phase 2 delivery" last />
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
      {label}
    </span>
  );
}

function ProjectRow({
  color,
  name,
  meta,
  pct,
  tone,
  last,
}: {
  color: string;
  name: string;
  meta: string;
  pct: string;
  tone: 'green' | 'amber';
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        borderBottom: last ? undefined : '1px solid var(--border)',
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{meta}</div>
      </div>
      <Badge tone={tone}>{pct}</Badge>
    </div>
  );
}

function Deadline({
  mon,
  day,
  tone,
  name,
  sub,
  subTone,
  last,
}: {
  mon: string;
  day: string;
  tone: 'red' | 'amber' | 'neutral';
  name: string;
  sub: string;
  subTone?: 'red';
  last?: boolean;
}) {
  const c =
    tone === 'red'
      ? { bg: 'var(--red-soft)', fg: 'var(--red)' }
      : tone === 'amber'
        ? { bg: 'var(--amber-soft)', fg: 'var(--amber)' }
        : { bg: 'var(--surface2)', fg: 'var(--text2)' };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '9px 0',
        borderBottom: last ? undefined : '1px solid var(--border)',
      }}
    >
      <div style={{ width: 40, textAlign: 'center', background: c.bg, borderRadius: 8, padding: '5px 0' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: c.fg, letterSpacing: '0.05em' }}>{mon}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: c.fg, lineHeight: 1.1 }}>{day}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 11.5, color: subTone === 'red' ? 'var(--red)' : 'var(--text3)', fontWeight: subTone ? 600 : 400 }}>
          {sub}
        </div>
      </div>
    </div>
  );
}
