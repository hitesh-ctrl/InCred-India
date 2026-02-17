from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class ScoreRequest(BaseModel):
    # E-commerce
    ecom_txn_count: float = Field(..., ge=0)
    ecom_spend: float = Field(..., ge=0)
    ecom_refund_rate: float = Field(..., ge=0, le=1)
    ecom_category_diversity: float = Field(..., ge=0)

    # Utility
    utility_on_time_ratio: float = Field(..., ge=0, le=1)
    utility_avg_days_late: float = Field(..., ge=0)
    utility_bill_volatility: float = Field(..., ge=0)

    # Digital wallet
    wallet_txn_count: float = Field(..., ge=0)
    wallet_txn_share: float = Field(..., ge=0, le=1)
    wallet_balance_volatility: float = Field(..., ge=0)

    # Cash flow
    income_monthly: float = Field(..., ge=0)
    inflow_volatility: float = Field(..., ge=0)
    outflow_volatility: float = Field(..., ge=0)
    net_cash_margin: float = Field(...)

    # Social media
    sm_post_freq: float = Field(..., ge=0)
    sm_engagement_score: float = Field(..., ge=0)
    sm_account_age_years: float = Field(..., ge=0)
    sm_activity_level: str = Field(..., pattern="^(low|medium|high)$")

    # Consent
    consent: bool


class ShapExplanation(BaseModel):
    feature_key: str
    feature_label: str
    value: Any
    shap_value: float
    impact: str  # "increases risk" / "reduces risk"


class ScoreResponse(BaseModel):
    credit_score: float
    risk_band: str
    probability_good: float
    probability_default: float
    top_explanations: list[ShapExplanation]
    model_version: str


class RiskBandDistributionItem(BaseModel):
    band: str
    count: int
    pct: float


class PortfolioKpis(BaseModel):
    auc: float
    avg_score: float
    default_rate: float
    risk_band_distribution: list[RiskBandDistributionItem]


class HistogramBucket(BaseModel):
    bucket_label: str
    count: int


class DistributionsResponse(BaseModel):
    score_histogram: list[HistogramBucket]
    risk_band_histogram: list[HistogramBucket]


class GlobalShapItem(BaseModel):
    feature_key: str
    feature_label: str
    mean_abs_shap: float
    relative_importance: float


class GlobalShapResponse(BaseModel):
    items: list[GlobalShapItem]


class FairnessGroupMetrics(BaseModel):
    group: str
    n: int
    avg_score: float
    approval_rate: float
    disparate_impact_ratio: Optional[float]


class FairnessResponse(BaseModel):
    income_quartiles: list[FairnessGroupMetrics]
    digital_adoption_groups: list[FairnessGroupMetrics]


class FeatureMetadataItem(BaseModel):
    key: str
    label: str
    description: str
    category: str


class FeatureMetadataResponse(BaseModel):
    features: list[FeatureMetadataItem]
    notes: dict[str, str]

