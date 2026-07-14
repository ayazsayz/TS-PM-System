import { useEffect, useState } from 'react';
import { Card, CardHeader, KpiCard, PageContainer, Ring } from '@/components';
import { ApiError } from '@/lib/apiClient';
import { reportsService, type ReportsSummary } from '@/services/workspaceService';

const money = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1000
      ? `$${Math.round(n / 1000)}k`
      : `$${Math.round(n)}`;

const hrs = (n: number) => `${Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 })}h`;

export default function ReportsPage() {
  const [data, setData] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reportsService
      .summary()
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Could not load reports.'),
      )
      .finally(() => setLoading(false));
  }, []);

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
  const hasData = d.estVsActual.length > 0 || d.billableSplit.billableHours > 0;

  if (!hasData) {
    return (
      <PageContainer>
        <h1 style={{ margin: '0 0 4px', fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Reports
        </h1>
        <div style={{ fontSize: 13.5, color: 'var(--text3)', marginBottom: 18 }}>
          Delivery and budget analytics
        </div>
        <Card>
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 650, color: 'var(--text2)', marginBottom: 6 }}>
              Nothing to report yet
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>
              Create projects and log time — budget, utilization and billing figures appear here
              automatically.
            </div>
          </div>
        </Card>
      </PageContainer>
    );
  }

  const totalSplit = d.billableSplit.billableHours + d.billableSplit.nonBillableHours;

  return (
    <PageContainer>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Reports
        </h1>
        <div style={{ fontSize: 13.5, color: 'var(--text3)' }}>
          Across all active projects · figures computed from logged time
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
        <KpiCard
          label="Total budget"
          value={money(d.totalBudget)}
          footer={<div style={{ fontSize: 12, color: 'var(--text3)' }}>across active projects</div>}
        />
        <KpiCard
          label="Spent"
          value={money(d.totalSpent)}
          valueColor={d.budgetUsedPercent > 100 ? 'var(--red)' : undefined}
          footer={
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color:
                  d.budgetUsedPercent > 100
                    ? 'var(--red)'
                    : d.budgetUsedPercent > 90
                      ? 'var(--amber)'
                      : 'var(--green)',
              }}
            >
              {d.budgetUsedPercent}% of budget
            </div>
          }
        />
        <KpiCard
          label="Hours logged"
          value={hrs(d.totalActualHours)}
          footer={
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              of {hrs(d.totalEstimatedHours)} estimated
            </div>
          }
        />
        <KpiCard
          label="Avg utilization"
          value={`${d.avgUtilizationPercent}%`}
          footer={<div style={{ fontSize: 12, color: 'var(--text3)' }}>across the team</div>}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 14, marginBottom: 14, alignItems: 'start' }}>
        {/* EST VS ACTUAL */}
        <Card>
          <CardHeader
            title="Estimated vs actual hours"
            action={<div style={{ fontSize: 12, color: 'var(--text3)' }}>per project</div>}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {d.estVsActual.map((p) => {
              const over = p.percent > 100;
              const near = p.percent > 90;
              const color = over ? 'var(--red)' : near ? 'var(--amber)' : 'var(--accent)';
              return (
                <div key={p.project}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{p.project}</span>
                    <span
                      className="tnum"
                      style={{ color: over || near ? color : 'var(--text3)', fontWeight: over || near ? 600 : 400 }}
                    >
                      {hrs(p.actual)} / {hrs(p.estimated)}
                      {p.estimated > 0 && ` · ${p.percent}%`}
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, p.percent)}%`,
                        height: '100%',
                        borderRadius: 99,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* BILLABLE SPLIT */}
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 14.5, fontWeight: 650, alignSelf: 'flex-start', marginBottom: 14 }}>
            Billable split
          </div>
          <Ring value={d.billableSplit.billablePercent} size={150} stroke={15}>
            <div className="tnum" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {d.billableSplit.billablePercent}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>billable</div>
          </Ring>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 18, fontSize: 12.5 }}>
            <SplitRow color="var(--accent)" label="Billable" value={hrs(d.billableSplit.billableHours)} />
            <SplitRow
              color="var(--border2)"
              label="Non-billable"
              value={hrs(d.billableSplit.nonBillableHours)}
            />
            <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 2 }}>
              {hrs(totalSplit)} logged in total
            </div>
          </div>
        </Card>
      </div>

      {/* CLIENT BILLING */}
      <Card>
        <div style={{ fontSize: 14.5, fontWeight: 650, marginBottom: 12 }}>Client billing</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
            padding: 8,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: 'var(--text3)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>CLIENT</div>
          <div style={{ textAlign: 'right' }}>PROJECTS</div>
          <div style={{ textAlign: 'right' }}>HOURS</div>
          <div style={{ textAlign: 'right' }}>SPEND</div>
        </div>
        {d.clientBilling.map((c) => (
          <div
            key={c.client}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
              alignItems: 'center',
              padding: '12px 8px',
              borderBottom: '1px solid var(--border)',
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 600 }}>{c.client}</div>
            <div className="tnum" style={{ textAlign: 'right', color: 'var(--text2)' }}>
              {c.projects}
            </div>
            <div className="tnum" style={{ textAlign: 'right' }}>
              {hrs(c.hours)}
            </div>
            <div className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>
              {money(c.spend)}
            </div>
          </div>
        ))}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
            alignItems: 'center',
            padding: '12px 8px',
            background: 'var(--surface2)',
            borderRadius: 8,
            marginTop: 6,
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 700 }}>Total</div>
          <div className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>
            {d.clientBilling.reduce((t, c) => t + c.projects, 0)}
          </div>
          <div className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>
            {hrs(d.totalActualHours)}
          </div>
          <div className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>
            {money(d.totalSpent)}
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}

function SplitRow({ color, label, value }: { color: string; label: string; value: string }) {
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
