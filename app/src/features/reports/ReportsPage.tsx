import { Card, CardHeader, KpiCard, PageContainer } from '@/components';
import { useUiStore } from '@/store/useUiStore';

const filters = [
  ['Q2 2026', 'Q1 2026', 'Last 12 months'],
  ['All projects', 'Aurora Cloud Migration', 'Helios ERP Rollout', 'Atlas Mobile Banking'],
  ['All clients', 'Nexbank', 'Vertex Retail', 'MedCore Health', 'GreenGrid Energy'],
  ['All departments', 'Engineering', 'Data', 'Design'],
];

const estActual: [string, string, number, string][] = [
  ['Aurora Cloud Migration', '860 / 1200h', 72, 'var(--accent)'],
  ['Helios ERP Rollout', '2310 / 2400h', 96, 'var(--amber)'],
  ['Atlas Mobile Banking', '1010 / 900h · 112%', 100, 'var(--red)'],
  ['Orion Data Platform', '610 / 1600h', 38, 'var(--accent)'],
  ['Zephyr Portal Redesign', '495 / 480h · 103%', 100, 'var(--amber)'],
];
const estActualLabelColor: Record<string, string> = {
  'Aurora Cloud Migration': 'var(--text3)',
  'Helios ERP Rollout': 'var(--amber)',
  'Atlas Mobile Banking': 'var(--red)',
  'Orion Data Platform': 'var(--text3)',
  'Zephyr Portal Redesign': 'var(--amber)',
};

const billing: [string, string, string, string, string][] = [
  ['Nexbank', '2,840h', '$512k', '38%', 'var(--green)'],
  ['Vertex Retail', '2,120h', '$398k', '34%', 'var(--green)'],
  ['MedCore Health', '980h', '$287k', '41%', 'var(--green)'],
  ['GreenGrid Energy', '470h', '$225k', '24%', 'var(--amber)'],
];

export default function ReportsPage() {
  const toast = useUiStore((s) => s.showToast);

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
          <h1 style={{ margin: '0 0 4px', fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>Reports</h1>
          <div style={{ fontSize: 13.5, color: 'var(--text3)' }}>Q2 2026 · Apr 1 – Jun 30 · All departments</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['PDF', 'Excel', 'CSV'].map((x) => (
            <button
              key={x}
              onClick={() => toast(`Exporting ${x}…`)}
              style={{ padding: '9px 13px', borderRadius: 9, border: '1px solid var(--border2)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text2)' }}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {filters.map((opts, i) => (
          <select
            key={i}
            style={{ padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border2)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text2)' }}
          >
            {opts.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
        <KpiCard label="Billable revenue" value="$1.42M" footer={<Delta tone="green">▲ 9.2% vs Q1</Delta>} />
        <KpiCard label="Delivery cost" value="$918k" footer={<Delta tone="amber">▲ 6.1% vs Q1</Delta>} />
        <KpiCard label="Profit margin" value="35.4%" footer={<Delta tone="green">▲ 1.8 pts vs Q1</Delta>} />
        <KpiCard label="Avg utilization" value="84%" footer={<div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>Target 85%</div>} />
      </div>

      {/* TREND + DONUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 14, marginBottom: 14, alignItems: 'start' }}>
        <Card>
          <CardHeader
            title="Logged hours trend · 12 weeks"
            action={<div style={{ fontSize: 12, color: 'var(--text3)' }}>All teams</div>}
          />
          <TrendChart />
        </Card>

        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 14.5, fontWeight: 650, alignSelf: 'flex-start', marginBottom: 14 }}>Billable split</div>
          <BillableDonut />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 18, fontSize: 12.5 }}>
            <DonutLegend color="var(--accent)" label="Billable" value="6,410h" />
            <DonutLegend color="var(--border2)" label="Non-billable" value="1,808h" />
          </div>
        </Card>
      </div>

      {/* EST VS ACTUAL + CLIENT BILLING */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <Card>
          <CardHeader
            title="Estimated vs actual hours"
            action={
              <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: 'var(--text3)' }}>
                <LegendDot color="var(--border2)" label="Est." />
                <LegendDot color="var(--accent)" label="Actual" />
              </div>
            }
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {estActual.map(([name, val, w, color]) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{name}</span>
                  <span className="tnum" style={{ color: estActualLabelColor[name], fontWeight: estActualLabelColor[name] === 'var(--text3)' ? 400 : 600 }}>
                    {val}
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden' }}>
                  <div style={{ width: `${w}%`, height: '100%', borderRadius: 99, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 14.5, fontWeight: 650, marginBottom: 12 }}>Client billing · Q2</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', padding: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
            <div>CLIENT</div>
            <div style={{ textAlign: 'right' }}>HOURS</div>
            <div style={{ textAlign: 'right' }}>BILLED</div>
            <div style={{ textAlign: 'right' }}>MARGIN</div>
          </div>
          {billing.map(([client, hours, billed, margin, color]) => (
            <div key={client} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', alignItems: 'center', padding: '12px 8px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <div style={{ fontWeight: 600 }}>{client}</div>
              <div className="tnum" style={{ textAlign: 'right' }}>{hours}</div>
              <div className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>{billed}</div>
              <div className="tnum" style={{ textAlign: 'right', fontWeight: 600, color }}>{margin}</div>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', alignItems: 'center', padding: '12px 8px', background: 'var(--surface2)', borderRadius: 8, marginTop: 6, fontSize: 13 }}>
            <div style={{ fontWeight: 700 }}>Total</div>
            <div className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>6,410h</div>
            <div className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>$1.42M</div>
            <div className="tnum" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green)' }}>35.4%</div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

function Delta({ tone, children }: { tone: 'green' | 'amber'; children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: `var(--${tone})`, fontWeight: 600 }}>{children}</div>;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 3, background: color }} />
      {label}
    </span>
  );
}

function DonutLegend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
      <span style={{ color: 'var(--text2)' }}>{label}</span>
      <span className="tnum" style={{ marginLeft: 'auto', fontWeight: 700 }}>
        {value}
      </span>
    </div>
  );
}

/** 12-week logged-hours area+line trend (paths mirror the mockup). */
function TrendChart() {
  return (
    <svg viewBox="0 0 660 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[40, 93, 146, 199].map((y) => (
        <line key={y} x1="20" y1={y} x2="640" y2={y} stroke="var(--border)" strokeWidth="1" />
      ))}
      <path
        d="M20 150 L76 124 L132 134 L188 98 L244 112 L300 86 L356 94 L412 72 L468 88 L524 62 L580 76 L640 52 L640 199 L20 199 Z"
        fill="var(--accent)"
        fillOpacity="0.09"
      />
      <path
        d="M20 150 L76 124 L132 134 L188 98 L244 112 L300 86 L356 94 L412 72 L468 88 L524 62 L580 76 L640 52"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="640" cy="52" r="4.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
      <text x="20" y="216" fontSize="10" fill="var(--text3)">W16</text>
      <text x="320" y="216" fontSize="10" fill="var(--text3)" textAnchor="middle">W21</text>
      <text x="640" y="216" fontSize="10" fill="var(--text3)" textAnchor="end">W27</text>
    </svg>
  );
}

/** Billable-split donut (78%). */
function BillableDonut() {
  return (
    <div style={{ position: 'relative', width: 150, height: 150 }}>
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r="60" fill="none" stroke="var(--surface2)" strokeWidth="15" />
        <circle
          cx="75"
          cy="75"
          r="60"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="15"
          strokeLinecap="round"
          strokeDasharray="294 377"
          transform="rotate(-90 75 75)"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="tnum" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
          78%
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>billable</div>
      </div>
    </div>
  );
}
