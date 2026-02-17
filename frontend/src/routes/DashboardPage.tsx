import { useEffect, useState } from 'react';
import { api } from '../api';

interface PortfolioKpis {
  auc: number;
  avg_score: number;
  default_rate: number;
  risk_band_distribution: { band: string; count: number; pct: number }[];
}

interface Distributions {
  score_histogram: { bucket_label: string; count: number }[];
  risk_band_histogram: { bucket_label: string; count: number }[];
}

interface GlobalShapItem {
  feature_key: string;
  feature_label: string;
  mean_abs_shap: number;
  relative_importance: number;
}

interface FairnessGroupMetrics {
  group: string;
  n: number;
  avg_score: number;
  approval_rate: number;
  disparate_impact_ratio: number | null;
}

interface FairnessResponse {
  income_quartiles: FairnessGroupMetrics[];
  digital_adoption_groups: FairnessGroupMetrics[];
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<PortfolioKpis | null>(null);
  const [dist, setDist] = useState<Distributions | null>(null);
  const [shap, setShap] = useState<GlobalShapItem[]>([]);
  const [fairness, setFairness] = useState<FairnessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [k, d, g, f] = await Promise.all([
          api.getPortfolioKpis(),
          api.getDistributions(),
          api.getGlobalShap(),
          api.getFairness(),
        ]);
        setKpis(k);
        setDist(d);
        setShap(g.items);
        setFairness(f);
      } catch {
        setError('Failed to load dashboard data');
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2" role="alert">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        {error}
      </div>
    );
  }

  if (!kpis || !dist || !fairness) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
        <p className="text-sm text-ink-tertiary">Loading dashboard analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink tracking-tight">Portfolio Dashboard</h1>
        <p className="text-ink-secondary mt-1">Real-time monitoring of model performance and fairness metrics.</p>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Validation AUC"
          value={kpis.auc.toFixed(3)}
          subtitle="Discrimination power on hold-out set"
          color="brand"
        />
        <KpiCard
          title="Average Score"
          value={kpis.avg_score.toFixed(0)}
          subtitle="Portfolio-wide average synthetic score"
          color="emerald"
        />
        <KpiCard
          title="Default Rate"
          value={`${(kpis.default_rate * 100).toFixed(1)}%`}
          subtitle="Share of defaults in synthetic data"
          color="amber"
        />
      </section>

      {/* Distribution Charts */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card title="Risk Band Distribution">
          <BarList
            items={kpis.risk_band_distribution.map((b) => ({
              label: b.band,
              value: b.count,
            }))}
            color="brand"
          />
        </Card>
        <Card title="Score Distribution (Binned)">
          <BarList
            items={dist.score_histogram.map((b) => ({
              label: b.bucket_label,
              value: b.count,
            }))}
            color="brand"
          />
        </Card>
      </section>

      {/* SHAP & Fairness */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card title="Global SHAP Importance (Top 5)">
          <div className="space-y-4">
            {shap.map((item) => (
              <div key={item.feature_key}>
                <div className="mb-1.5 flex justify-between items-center text-sm">
                  <span className="font-medium text-ink">{item.feature_label}</span>
                  <span className="text-xs font-semibold text-ink-secondary bg-surface-tertiary px-2 py-0.5 rounded-md tabular-nums">
                    {(item.relative_importance * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-tertiary">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(100, item.relative_importance * 100 * 1.5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Fairness Audit">
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="mb-3 font-semibold text-ink flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand" aria-hidden="true" />
                Income Quartiles (Approval Rate)
              </h3>
              <BarList
                items={fairness.income_quartiles.map((g) => ({
                  label: `${g.group} (DIR ${g.disparate_impact_ratio ? g.disparate_impact_ratio.toFixed(2) : '\u2013'})`,
                  value: g.approval_rate * 100,
                }))}
                valueSuffix="%"
                color="brand"
              />
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-ink flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                Digital Adoption Groups (Approval Rate)
              </h3>
              <BarList
                items={fairness.digital_adoption_groups.map((g) => ({
                  label: `${g.group} (DIR ${g.disparate_impact_ratio ? g.disparate_impact_ratio.toFixed(2) : '\u2013'})`,
                  value: g.approval_rate * 100,
                }))}
                valueSuffix="%"
                color="emerald"
              />
            </div>
            <div className="bg-brand-50 border border-brand-200 p-3 rounded-lg text-xs text-brand-800 leading-relaxed">
              <strong>Note:</strong>{' '}
              Disparate impact ratio (DIR) compares approval rate to a reference group
              (Q4 for income, high adoption for digital usage).
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

function KpiCard({ title, value, subtitle, color }: { title: string; value: string; subtitle: string; color: string }) {
  const indicatorColor =
    color === 'brand' ? 'bg-brand' : color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <div className="card-surface rounded-card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${indicatorColor}`} aria-hidden="true" />
        <span className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">{title}</span>
      </div>
      <div className="text-3xl font-extrabold text-ink tracking-tight tabular-nums">{value}</div>
      <div className="text-xs text-ink-tertiary">{subtitle}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-surface rounded-card p-6 h-full">
      <h2 className="mb-5 text-xs font-semibold text-ink-tertiary uppercase tracking-wider pb-3 border-b border-surface-border">
        {title}
      </h2>
      {children}
    </div>
  );
}

function BarList({ items, valueSuffix, color = 'brand' }: {
  items: { label: string; value: number }[];
  valueSuffix?: string;
  color?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  const barColor =
    color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-brand';

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="font-medium text-ink-secondary">{item.label}</span>
            <span className="font-semibold text-ink tabular-nums">
              {item.value.toFixed(1)}{valueSuffix ?? ''}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-tertiary">
            <div
              className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
              style={{ width: `${((item.value || 0) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
