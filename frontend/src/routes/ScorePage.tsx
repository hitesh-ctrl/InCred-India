import { useState } from 'react';
import { api } from '../api';
import type { ScoreRequest, ScoreResponse } from '../api';

const defaultValues: Omit<ScoreRequest, 'consent'> = {
  ecom_txn_count: 10,
  ecom_spend: 20000,
  ecom_refund_rate: 0.02,
  ecom_category_diversity: 4,
  utility_on_time_ratio: 0.9,
  utility_avg_days_late: 1,
  utility_bill_volatility: 50,
  wallet_txn_count: 8,
  wallet_txn_share: 0.4,
  wallet_balance_volatility: 30,
  income_monthly: 60000,
  inflow_volatility: 5000,
  outflow_volatility: 4000,
  net_cash_margin: 0.15,
  sm_post_freq: 5,
  sm_engagement_score: 1,
  sm_account_age_years: 3,
  sm_activity_level: 'medium',
};

function ChevronDownIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

export default function ScorePage() {
  const [form, setForm] = useState(defaultValues);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);

  const onChange = (field: keyof typeof form, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value as never }));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const payload: ScoreRequest = { ...form, consent };
      const res = await api.score(payload);
      setResult(res);
    } catch (e: unknown) {
      const anyErr = e as { response?: { data?: { detail?: string } } };
      setError(anyErr?.response?.data?.detail ?? 'Scoring failed');
    } finally {
      setLoading(false);
    }
  };

  const scorePercent = result ? ((result.credit_score - 300) / 600) * 100 : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-12 max-w-7xl mx-auto">
      {/* Form Panel */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand bg-brand-50 border border-brand-200 mb-3">
            Live Demo
          </span>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Synthetic Application</h1>
          <p className="text-ink-secondary mt-1">
            Adjust behavioral inputs to generate a real-time credit score.
          </p>
        </div>

        <div className="card-surface rounded-card p-6">
          <div className="grid gap-8 md:grid-cols-2">
            <Section title="E-Commerce Behavior">
              <NumberField label="Transaction Count" value={form.ecom_txn_count} onChange={(v) => onChange('ecom_txn_count', v)} />
              <NumberField label="Monthly Spend ($)" value={form.ecom_spend} onChange={(v) => onChange('ecom_spend', v)} />
              <NumberField label="Refund Rate" step={0.01} value={form.ecom_refund_rate} onChange={(v) => onChange('ecom_refund_rate', v)} />
            </Section>

            <Section title="Financial Health">
              <NumberField label="Utility Payment Ratio" step={0.01} value={form.utility_on_time_ratio} onChange={(v) => onChange('utility_on_time_ratio', v)} />
              <NumberField label="Net Cash Margin" step={0.01} value={form.net_cash_margin} onChange={(v) => onChange('net_cash_margin', v)} />
              <NumberField label="Monthly Income ($)" value={form.income_monthly} onChange={(v) => onChange('income_monthly', v)} />
            </Section>

            <div className="md:col-span-2 pt-4 border-t border-surface-border mt-2">
              <label className="block text-sm font-medium text-ink mb-2">Social Engagement Level</label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-lg border border-surface-border bg-surface px-4 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors cursor-pointer hover:border-surface-border-hover"
                  value={form.sm_activity_level}
                  onChange={(e) => onChange('sm_activity_level', e.target.value as 'low' | 'medium' | 'high')}
                >
                  <option value="low">Low Activity</option>
                  <option value="medium">Medium Activity</option>
                  <option value="high">High Activity</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-ink-tertiary">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-surface-border">
            <label className="flex items-start gap-3 cursor-pointer group p-3 -m-3 rounded-lg hover:bg-surface-secondary transition-colors">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (!e.target.checked) setResult(null);
                }}
                className="mt-0.5 h-4 w-4 rounded border-surface-border-hover text-brand focus:ring-brand/30 cursor-pointer"
              />
              <div className="text-sm">
                <span className="font-medium text-ink block mb-0.5">Data Consent Required</span>
                <span className="text-ink-secondary">I ensure that I have read the privacy policy and consent to the processing of this synthetic data for scoring purposes.</span>
              </div>
            </label>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!consent || loading}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-ink-inverse hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Analyzing Data Patterns...
                </>
              ) : 'Compute Credit Score'}
            </button>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2" role="alert">
                <AlertIcon />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Panel */}
      <div className="lg:col-span-5">
        <div className={`min-h-[500px] rounded-card border transition-colors duration-300 ${
          result
            ? 'card-surface'
            : 'border-dashed border-surface-border-hover bg-surface-secondary flex items-center justify-center'
        }`}>
          {!result && (
            <div className="text-center p-8">
              <div className="w-12 h-12 rounded-full bg-surface-tertiary flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-ink-tertiary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-ink mb-1">Awaiting Input</h3>
              <p className="text-xs text-ink-tertiary max-w-[200px] mx-auto leading-relaxed">
                Fill out the form and grant consent to generate your credit assessment.
              </p>
            </div>
          )}

          {result && (
            <div className="p-6 space-y-6 flex flex-col h-full">
              {/* Score Header */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Credit Score</h2>
                  <RiskBadge band={result.risk_band} />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-extrabold text-ink tracking-tighter">
                    {result.credit_score.toFixed(0)}
                  </span>
                  <span className="text-lg font-semibold text-ink-tertiary">/ 900</span>
                </div>
                <div className="mt-4 h-2 w-full bg-surface-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      result.credit_score >= 700
                        ? 'bg-emerald-500'
                        : result.credit_score >= 600
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(5, scorePercent)}%` }}
                  />
                </div>
              </div>

              {/* Probability Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-surface-secondary border border-surface-border">
                  <div className="text-xs font-medium text-ink-tertiary uppercase tracking-wide mb-1">Approval Odds</div>
                  <div className="text-xl font-bold text-ink">{(result.probability_good * 100).toFixed(1)}%</div>
                </div>
                <div className="p-4 rounded-lg bg-surface-secondary border border-surface-border">
                  <div className="text-xs font-medium text-ink-tertiary uppercase tracking-wide mb-1">Default Risk</div>
                  <div className="text-xl font-bold text-ink">{(result.probability_default * 100).toFixed(1)}%</div>
                </div>
              </div>

              {/* SHAP Explanations */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Key Drivers</h3>
                  <span className="text-[10px] font-medium text-ink-tertiary bg-surface-tertiary px-1.5 py-0.5 rounded">SHAP</span>
                </div>
                <ul className="space-y-4">
                  {result.top_explanations.map((ex) => (
                    <li key={ex.feature_key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-ink">{ex.feature_label}</span>
                        <span className={`text-xs font-semibold uppercase tracking-wide ${
                          ex.impact === 'reduces risk' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {ex.impact}
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            ex.shap_value >= 0 ? 'bg-red-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.abs(ex.shap_value) * 50)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ band }: { band: string }) {
  const classes =
    band === 'Very Low' || band === 'Low'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : band === 'Medium'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-red-50 text-red-700 border-red-200';

  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${classes}`}>
      {band} Risk
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  step?: number;
  onChange: (val: number) => void;
}

function NumberField({ label, value, step = 1, onChange }: NumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-ink">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="block w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-ink transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none hover:border-surface-border-hover"
      />
    </div>
  );
}
