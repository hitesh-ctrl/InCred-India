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
      } catch (e) {
        setError('Failed to load dashboard data');
      }
    })();
  }, []);

  if (error) {
    return <div className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">{error}</div>;
  }

  if (!kpis || !dist || !fairness) {
    return <div className="flex flex-col items-center justify-center h-96 text-slate-400 gap-4">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      <p className="animate-pulse">Loading dashboard analytics...</p>
    </div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Portfolio <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-vivid-600">Dashboard</span></h1>
        <p className="text-slate-500 mt-2 text-lg">Real-time monitoring of model performance and fairness metrics.</p>
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <KpiCard
          title="Validation AUC"
          value={kpis.auc.toFixed(3)}
          subtitle="Discrimination power on hold-out set"
          icon="🎯"
          color="indigo"
        />
        <KpiCard
          title="Average Score"
          value={kpis.avg_score.toFixed(0)}
          subtitle="Portfolio-wide average synthetic score"
          icon="📊"
          color="emerald"
        />
        <KpiCard
          title="Default Rate"
          value={`${(kpis.default_rate * 100).toFixed(1)}%`}
          subtitle="Share of defaults in synthetic data"
          icon="⚠️"
          color="amber"
          trend="down"
        />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card title="Risk Band Distribution">
          <BarList
            items={kpis.risk_band_distribution.map((b) => ({
              label: b.band,
              value: b.count,
            }))}
            color="indigo"
          />
        </Card>
        <Card title="Score Distribution (Binned)">
          <BarList
            items={dist.score_histogram.map((b) => ({
              label: b.bucket_label,
              value: b.count,
            }))}
            color="violet"
          />
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card title="Global SHAP Importance (Top 5)">
          <div className="space-y-5">
            {shap.map((item, i) => (
              <div key={item.feature_key} className="group cursor-default">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-slate-700 group-hover:text-primary transition-colors">{item.feature_label}</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {(item.relative_importance * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)] relative"
                    style={{
                      width: `${Math.min(
                        100,
                        item.relative_importance * 100 * 1.5,
                      ).toString()}%`,
                      transition: `width 1s ease-out ${i * 100}ms`
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Fairness Audit">
          <div className="space-y-8 text-sm">
            <div>
              <h3 className="mb-4 font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                Income Quartiles (Approval Rate)
              </h3>
              <BarList
                items={fairness.income_quartiles.map((g) => ({
                  label: `${g.group} (DIR ${g.disparate_impact_ratio
                    ? g.disparate_impact_ratio.toFixed(2)
                    : '–'
                    })`,
                  value: g.approval_rate * 100,
                }))}
                valueSuffix="%"
                color="indigo"
              />
            </div>
            <div>
              <h3 className="mb-4 font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]"></span>
                Digital Adoption Groups (Approval Rate)
              </h3>
              <BarList
                items={fairness.digital_adoption_groups.map((g) => ({
                  label: `${g.group} (DIR ${g.disparate_impact_ratio
                    ? g.disparate_impact_ratio.toFixed(2)
                    : '–'
                    })`,
                  value: g.approval_rate * 100,
                }))}
                valueSuffix="%"
                color="teal"
              />
            </div>
            <div className="bg-indigo-50/50 p-4 rounded-xl text-xs text-indigo-800 border border-indigo-100 flex gap-2">
              <span className="text-lg">📢</span>
              <p>
                <span className="font-bold">Note: </span>
                Disparate impact ratio (DIR) compares approval rate to a reference group
                (Q4 for income, high adoption for digital usage).
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

function KpiCard(props: { title: string; value: string; subtitle: string; icon: string; color: string; trend?: string }) {
  const { title, value, subtitle, icon, color } = props;

  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600'
  }[color] || 'bg-slate-50 text-slate-600';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-md p-6 shadow-glass border border-white/50 card-hover group">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${color === 'indigo' ? 'bg-indigo-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'} group-hover:scale-150 transition-transform duration-500`}></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</div>
        <div className={`p-2 rounded-xl ${colorClasses} text-2xl shadow-sm`}>{icon}</div>
      </div>
      <div className="text-4xl font-extrabold text-slate-900 tracking-tight relative z-10">{value}</div>
      <div className="mt-2 text-xs font-medium text-slate-400 relative z-10">{subtitle}</div>
    </div>
  );
}

function Card(props: { title: string; children: React.ReactNode }) {
  const { title, children } = props;
  return (
    <div className="rounded-2xl bg-white/60 backdrop-blur-sm p-8 shadow-glass border border-white/50 h-full card-hover">
      <h2 className="mb-6 text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/50 pb-3 flex items-center gap-2">
        {title}
        <div className="h-px bg-slate-200/50 flex-1"></div>
      </h2>
      {children}
    </div>
  );
}

function BarList(props: {
  items: { label: string; value: number }[];
  valueSuffix?: string;
  color?: string;
}) {
  const { items, valueSuffix, color = 'primary' } = props;
  const max = Math.max(...items.map((i) => i.value), 1);

  const getGradient = (c: string) => {
    if (c === 'teal') return 'bg-gradient-to-r from-teal-400 to-teal-500';
    if (c === 'indigo') return 'bg-gradient-to-r from-indigo-400 to-indigo-500';
    if (c === 'violet') return 'bg-gradient-to-r from-violet-400 to-violet-500';
    return 'bg-gradient-to-r from-indigo-500 to-purple-600';
  }

  const barClass = getGradient(color);

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.label} className="group">
          <div className="mb-2 flex justify-between text-xs">
            <span className="font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{item.label}</span>
            <span className="font-mono font-bold text-slate-500 bg-slate-100/50 px-1.5 py-0.5 rounded">
              {item.value.toFixed(1)}
              {valueSuffix ?? ''}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${barClass} shadow-sm relative`}
              style={{
                width: `${((item.value || 0) / max) * 100}%`,
                transition: `width 1s ease-out ${i * 50}ms`
              }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
