import { Badge, Card, Icon, PageContainer } from '@/components';
import { avatarColors, projects } from '@/lib/mockData';
import { budgetColor, healthTone } from '@/lib/calc';
import type { Project } from '@/lib/types';
import { useTimesheetStore } from '@/store/useTimesheetStore';

const chips = ['All', 'Running', 'At risk', 'Completed'];
const riskSet = ['At risk', 'Over budget', 'Delayed'];

function matches(p: Project, filter: string): boolean {
  if (filter === 'All') return true;
  if (filter === 'Running') return p.health !== 'Completed';
  if (filter === 'At risk') return riskSet.includes(p.health);
  return p.health === 'Completed';
}

export default function ProjectsPage() {
  const projFilter = useTimesheetStore((s) => s.projFilter);
  const setProjFilter = useTimesheetStore((s) => s.setProjFilter);

  // Exclude the internal "eTech" bucket, like the mockup.
  const real = projects.filter((p) => p.client !== 'eTech');
  const visible = real.filter((p) => matches(p, projFilter));

  return (
    <PageContainer>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Projects
          </h1>
          <div style={{ fontSize: 13.5, color: 'var(--text3)' }}>6 active engagements · 4 clients</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {chips.map((c) => {
            const n = real.filter((p) => matches(p, c)).length;
            const active = projFilter === c;
            return (
              <span
                key={c}
                onClick={() => setProjFilter(c)}
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: active ? 'var(--bg)' : 'var(--text2)',
                  background: active ? 'var(--text)' : 'var(--surface)',
                  border: `1px solid ${active ? 'var(--text)' : 'var(--border2)'}`,
                  borderRadius: 99,
                  padding: '7px 14px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.15s',
                }}
              >
                {c} · {n}
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 14 }}>
        {visible.map((p) => (
          <ProjectCard key={p.name} p={p} />
        ))}
      </div>
    </PageContainer>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const rem = p.est - p.act;
  const bpct = p.budget ? Math.round((p.spent / p.budget) * 100) : 0;
  const bColor = budgetColor(bpct);

  const statBox = (label: string, value: string, color?: string) => (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 12px' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div className="tnum" style={{ fontSize: 14, fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  );

  return (
    <Card hoverable style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color, marginTop: 5, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 650, letterSpacing: '-0.01em' }}>{p.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>
            {p.client} · due {p.due}
          </div>
        </div>
        <Badge tone={healthTone(p.health)}>{p.health}</Badge>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
          <span>Completion</span>
          <span className="tnum" style={{ fontWeight: 700, color: 'var(--text)' }}>
            {p.completion}%
          </span>
        </div>
        <div style={{ height: 7, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden' }}>
          <div style={{ width: `${p.completion}%`, height: '100%', borderRadius: 99, background: p.color }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {statBox('ESTIMATED', `${p.est}h`)}
        {statBox('ACTUAL', `${p.act}h`)}
        {statBox('REMAINING', rem >= 0 ? `${rem}h left` : `${Math.abs(rem)}h over`, rem >= 0 ? 'var(--text2)' : 'var(--red)')}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
          <span>
            Budget · ${Math.round(p.spent / 1000)}k of ${Math.round(p.budget / 1000)}k
          </span>
          <span className="tnum" style={{ fontWeight: 700, color: bColor }}>
            {bpct}%
          </span>
        </div>
        <div style={{ height: 7, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, bpct)}%`, height: '100%', borderRadius: 99, background: bColor }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ display: 'flex' }}>
          {p.team.map((init, i) => (
            <div
              key={i}
              style={{
                width: 26,
                height: 26,
                borderRadius: 99,
                background: avatarColors[init] || '#475467',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9.5,
                fontWeight: 700,
                border: '2px solid var(--surface)',
                marginLeft: i === 0 ? 0 : -6,
              }}
            >
              {init}
            </div>
          ))}
        </div>
        {p.warn && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--red)' }}>
            <Icon name="alert" size={12} />
            {p.warn}
          </span>
        )}
      </div>
    </Card>
  );
}
