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
      const anyErr = e as any;
      setError(anyErr?.response?.data?.detail ?? 'Scoring failed');
    } finally {
      setLoading(false);
    }
  };

  const scorePercent = result ? ((result.credit_score - 300) / 600) * 100 : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-12 max-w-7xl mx-auto">
      <div className="space-y-6 lg:col-span-7">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-glass border border-white/50 p-8">
          <div className="mb-8">
            <div className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
              Live Demo
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Synthetic Application</h2>
            <p className="text-slate-500 mt-2 text-lg">
              Adjust behavioral inputs to generate a real-time credit score.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Section title="E-Commerce Behavior">
              <NumberField
                label="Transaction Count"
                value={form.ecom_txn_count}
                onChange={(v) => onChange('ecom_txn_count', v)}
              />
              <NumberField
                label="Monthly Spend ($)"
                value={form.ecom_spend}
                onChange={(v) => onChange('ecom_spend', v)}
              />
              <NumberField
                label="Refund Rate"
                step={0.01}
                value={form.ecom_refund_rate}
                onChange={(v) => onChange('ecom_refund_rate', v)}
              />
            </Section>

            <Section title="Financial Health">
              <NumberField
                label="Utility Payment Ratio"
                step={0.01}
                value={form.utility_on_time_ratio}
                onChange={(v) => onChange('utility_on_time_ratio', v)}
              />
              <NumberField
                label="Net Cash Margin"
                step={0.01}
                value={form.net_cash_margin}
                onChange={(v) => onChange('net_cash_margin', v)}
              />
              <NumberField
                label="Monthly Income ($)"
                value={form.income_monthly}
                onChange={(v) => onChange('income_monthly', v)}
              />
            </Section>

            <div className="md:col-span-2 pt-4 border-t border-slate-200/50 mt-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Social Engagement Level</label>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white/50 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer hover:bg-white"
                  value={form.sm_activity_level}
                  onChange={(e) =>
                    onChange('sm_activity_level', e.target.value as 'low' | 'medium' | 'high')
                  }
                >
                  <option value="low">Low Activity</option>
                  <option value="medium">Medium Activity</option>
                  <option value="high">High Activity</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200/50">
            <label className="flex items-start gap-4 cursor-pointer group p-4 rounded-xl border border-transparent hover:bg-primary/5 transition-colors">
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (!e.target.checked) setResult(null);
                  }}
                  className="peer h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary transition-all cursor-pointer"
                />
              </div>
              <div className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                <span className="font-semibold block text-slate-900 mb-0.5">Data Consent Required</span>
                I ensure that I have read the privacy policy and consent to the processing of this synthetic data for scoring purposes.
              </div>
            </label>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!consent || loading}
              className="mt-6 w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-vivid-600 px-6 py-4 text-sm font-bold text-white shadow-neon hover:shadow-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all transform active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Analyzing Data Patterns...
                </span>
              ) : 'Compute CrediScore AI'}
            </button>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>{error}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 lg:col-span-5">
        <div className={`h-full min-h-[500px] rounded-2xl border transition-all duration-700 overflow-hidden relative ${result ? 'bg-white/80 backdrop-blur-md border-white/50 shadow-glass' : 'bg-white/40 backdrop-blur-sm border-dashed border-slate-300 flex items-center justify-center'}`}>
          {!result && (
            <div className="text-center text-slate-400 p-8">
              <div className="text-6xl mb-4 opacity-50">🔮</div>
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Awaiting Input</h3>
              <p className="text-sm max-w-xs mx-auto">
                Fill out the behavioral form and grant consent to generate your AI-powered credit assessment.
              </p>
            </div>
          )}
          {result && (
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 h-full flex flex-col">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Credit Score</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${result.risk_band === 'Very Low' || result.risk_band === 'Low' ? 'bg-emerald-100 text-emerald-700' :
                      result.risk_band === 'Medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                    {result.risk_band} Risk
                  </span>
                </div>

                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600">
                    {result.credit_score.toFixed(0)}
                  </span>
                  <span className="text-2xl font-bold text-slate-300">/ 900</span>
                </div>

                {/* Updated Score Bar */}
                <div className="mt-6 relative h-4 w-full bg-slate-100/80 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1500 ease-out shadow-[0_0_20px_rgba(0,0,0,0.3)] ${result.credit_score >= 700 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                        result.credit_score >= 600 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                          'bg-gradient-to-r from-red-500 to-pink-600'
                      }`}
                    style={{ width: `${Math.max(5, scorePercent)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50/80 rounded-xl border border-white/50 shadow-sm backdrop-blur-sm">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Approval Odds</div>
                  <div className="text-2xl font-bold text-slate-900">{(result.probability_good * 100).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-slate-50/80 rounded-xl border border-white/50 shadow-sm backdrop-blur-sm">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Default Risk</div>
                  <div className="text-2xl font-bold text-slate-900">{(result.probability_default * 100).toFixed(1)}%</div>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="mb-4 text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  Key Drivers <span className="text-xs font-normal normal-case text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">SHAP Analysis</span>
                </h3>
                <ul className="space-y-4">
                  {result.top_explanations.map((ex, i) => (
                    <li key={ex.feature_key} className="space-y-2 animate-in slide-in-from-right-4 fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{ex.feature_label}</span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${ex.impact === 'reduces risk' ? 'text-emerald-600' : 'text-red-500'}`}>{ex.impact}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] ${ex.shap_value >= 0 ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'}`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.abs(ex.shap_value) * 50,
                              ).toString()}%`,
                            }}
                          />
                        </div>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
        {title}
        <div className="h-px bg-slate-200 flex-1"></div>
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

interface NumberFieldProps {
  label: string;
  value: number;
  step?: number;
  onChange: (val: number) => void;
}

function NumberField({ label, value, step = 1, onChange }: NumberFieldProps) {
  return (
    <div className="space-y-1.5 group">
      <label className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="block w-full rounded-xl border-slate-300 bg-white/50 px-3 py-2.5 text-sm shadow-sm transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 hover:border-primary/50"
      />
    </div>
  );
}
