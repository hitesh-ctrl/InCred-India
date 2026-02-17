import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export interface ScoreRequest {
  ecom_txn_count: number;
  ecom_spend: number;
  ecom_refund_rate: number;
  ecom_category_diversity: number;
  utility_on_time_ratio: number;
  utility_avg_days_late: number;
  utility_bill_volatility: number;
  wallet_txn_count: number;
  wallet_txn_share: number;
  wallet_balance_volatility: number;
  income_monthly: number;
  inflow_volatility: number;
  outflow_volatility: number;
  net_cash_margin: number;
  sm_post_freq: number;
  sm_engagement_score: number;
  sm_account_age_years: number;
  sm_activity_level: 'low' | 'medium' | 'high';
  consent: boolean;
}

export interface ShapExplanation {
  feature_key: string;
  feature_label: string;
  value: string | number;
  shap_value: number;
  impact: string;
}

export interface ScoreResponse {
  credit_score: number;
  risk_band: string;
  probability_good: number;
  probability_default: number;
  top_explanations: ShapExplanation[];
  model_version: string;
}

export const api = {
  async score(payload: ScoreRequest): Promise<ScoreResponse> {
    const { data } = await axios.post<ScoreResponse>(`${API_BASE}/score`, payload);
    return data;
  },
  async getPortfolioKpis() {
    const { data } = await axios.get(`${API_BASE}/dashboard/portfolio-kpis`);
    return data;
  },
  async getDistributions() {
    const { data } = await axios.get(`${API_BASE}/dashboard/distributions`);
    return data;
  },
  async getGlobalShap() {
    const { data } = await axios.get(`${API_BASE}/dashboard/global-shap`);
    return data;
  },
  async getFairness() {
    const { data } = await axios.get(`${API_BASE}/dashboard/fairness`);
    return data;
  },
  async getFeatureMetadata() {
    const { data } = await axios.get(`${API_BASE}/config/feature-metadata`);
    return data;
  },
};

