from __future__ import annotations

from dataclasses import dataclass
from typing import Any, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
import shap
from imblearn.over_sampling import SMOTE
from pydantic import BaseModel
from sklearn.compose import ColumnTransformer
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

from schemas import (
    DistributionsResponse,
    FairnessGroupMetrics,
    FairnessResponse,
    FeatureMetadataItem,
    FeatureMetadataResponse,
    GlobalShapItem,
    GlobalShapResponse,
    HistogramBucket,
    PortfolioKpis,
    RiskBandDistributionItem,
    ScoreRequest,
    ScoreResponse,
    ShapExplanation,
)


RANDOM_SEED = 42
N_ROWS = 10_000
MODEL_VERSION = "v1.0"


@dataclass
class TrainedArtifacts:
    df: pd.DataFrame
    X_train: Any
    y_train: np.ndarray
    X_val: Any
    y_val: np.ndarray
    pipeline: Pipeline
    model: XGBClassifier
    explainer: shap.TreeExplainer
    auc: float
    score_min: float
    score_max: float


class ModelService(BaseModel):
    """Encapsulates training, scoring, SHAP and fairness logic."""

    artifacts: Optional[TrainedArtifacts] = None

    class Config:
        arbitrary_types_allowed = True

    # ------------------ lifecycle ------------------ #

    def train_at_startup(self) -> None:
        np.random.seed(RANDOM_SEED)
        df = self._generate_synthetic_data(N_ROWS)

        idx = np.arange(len(df))
        train_idx, val_idx = train_test_split(
            idx,
            test_size=0.2,
            stratify=df["defaulted"],
            random_state=RANDOM_SEED,
        )
        df_train = df.iloc[train_idx].reset_index(drop=True)
        df_val = df.iloc[val_idx].reset_index(drop=True)

        feature_cols, cat_cols = self._get_feature_columns()
        y_train = df_train["defaulted"].values
        y_val = df_val["defaulted"].values

        numeric_features = [c for c in feature_cols if c not in cat_cols]
        categorical_features = cat_cols

        preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), numeric_features),
                ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
            ]
        )

        pipeline = Pipeline(steps=[("pre", preprocessor)])

        X_train_raw = df_train[feature_cols]
        X_val_raw = df_val[feature_cols]

        X_train_proc = pipeline.fit_transform(X_train_raw)
        X_val_proc = pipeline.transform(X_val_raw)

        sm = SMOTE(random_state=RANDOM_SEED)
        X_train_sm, y_train_sm = sm.fit_resample(X_train_proc, y_train)

        model = XGBClassifier(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="binary:logistic",
            eval_metric="logloss",
            random_state=RANDOM_SEED,
            n_jobs=4,
        )
        model.fit(X_train_sm, y_train_sm)

        y_val_proba_good = model.predict_proba(X_val_proc)[:, 1]
        auc = roc_auc_score(y_val, y_val_proba_good)

        # SHAP background
        dense_train = X_train_proc.toarray() if hasattr(X_train_proc, "toarray") else X_train_proc
        bg_size = min(1000, dense_train.shape[0])
        bg_idx = np.random.choice(dense_train.shape[0], size=bg_size, replace=False)
        bg_data = dense_train[bg_idx]
        explainer = shap.TreeExplainer(model, bg_data)

        self.artifacts = TrainedArtifacts(
            df=df,
            X_train=X_train_proc,
            y_train=y_train,
            X_val=X_val_proc,
            y_val=y_val,
            pipeline=pipeline,
            model=model,
            explainer=explainer,
            auc=float(auc),
            score_min=300.0,
            score_max=900.0,
        )

    # ------------------ public API ------------------ #

    def score(self, req: ScoreRequest) -> ScoreResponse:
        art = self._require_artifacts()

        feats = self._request_to_df(req)
        feature_cols, _ = self._get_feature_columns()
        feats = feats[feature_cols]

        pipe = art.pipeline
        X = pipe.transform(feats)

        model = art.model
        proba_good = float(model.predict_proba(X)[0, 1])
        proba_default = 1.0 - proba_good

        score = self._map_prob_to_score(proba_good)
        band = self._score_to_band(score)

        top_explanations = self._get_instance_shap(feats, X)

        return ScoreResponse(
            credit_score=score,
            risk_band=band,
            probability_good=proba_good,
            probability_default=proba_default,
            top_explanations=top_explanations,
            model_version=MODEL_VERSION,
        )

    def get_portfolio_kpis(self) -> PortfolioKpis:
        art = self._require_artifacts()
        df = art.df.copy()
        feature_cols, _ = self._get_feature_columns()

        X_all = art.pipeline.transform(df[feature_cols])
        proba_good = art.model.predict_proba(X_all)[:, 1]
        scores = np.array([self._map_prob_to_score(p) for p in proba_good])
        df["score"] = scores
        df["risk_band"] = [self._score_to_band(s) for s in scores]

        avg_score = float(df["score"].mean())
        default_rate = float(df["defaulted"].mean())

        dist: list[RiskBandDistributionItem] = []
        for band in ["Very Low", "Low", "Medium", "High", "Very High"]:
            count = int((df["risk_band"] == band).sum())
            pct = float(count / len(df))
            dist.append(RiskBandDistributionItem(band=band, count=count, pct=pct))

        return PortfolioKpis(
            auc=float(art.auc),
            avg_score=avg_score,
            default_rate=default_rate,
            risk_band_distribution=dist,
        )

    def get_distributions(self) -> DistributionsResponse:
        art = self._require_artifacts()
        df = art.df.copy()
        feature_cols, _ = self._get_feature_columns()

        X_all = art.pipeline.transform(df[feature_cols])
        proba_good = art.model.predict_proba(X_all)[:, 1]
        scores = np.array([self._map_prob_to_score(p) for p in proba_good])
        df["score"] = scores
        df["risk_band"] = [self._score_to_band(s) for s in scores]

        score_buckets: list[HistogramBucket] = []
        for start in range(300, 900, 50):
            end = start + 50
            m = (df["score"] >= start) & (df["score"] < end)
            score_buckets.append(
                HistogramBucket(bucket_label=f"{start}-{end}", count=int(m.sum()))
            )

        band_hist: list[HistogramBucket] = []
        for band in ["Very Low", "Low", "Medium", "High", "Very High"]:
            band_hist.append(
                HistogramBucket(
                    bucket_label=band, count=int((df["risk_band"] == band).sum())
                )
            )

        return DistributionsResponse(
            score_histogram=score_buckets,
            risk_band_histogram=band_hist,
        )

    def get_global_shap(self) -> GlobalShapResponse:
        art = self._require_artifacts()
        df = art.df.copy()
        feature_cols, _ = self._get_feature_columns()

        sample = df[feature_cols].sample(
            n=min(1000, len(df)), random_state=RANDOM_SEED
        )
        X_sample = art.pipeline.transform(sample)
        shap_vals = art.explainer.shap_values(X_sample)
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[1]

        mean_abs = np.mean(np.abs(shap_vals), axis=0)
        feature_names = self._get_transformed_feature_names()

        items: list[GlobalShapItem] = []
        total = float(mean_abs.sum()) or 1.0
        top_idx = np.argsort(mean_abs)[::-1][:5]
        for idx in top_idx:
            key = feature_names[idx]
            label = self._pretty_label_from_feature_key(key)
            val = float(mean_abs[idx])
            rel = float(val / total)
            items.append(
                GlobalShapItem(
                    feature_key=key,
                    feature_label=label,
                    mean_abs_shap=val,
                    relative_importance=rel,
                )
            )

        return GlobalShapResponse(items=items)

    def get_fairness(self) -> FairnessResponse:
        art = self._require_artifacts()
        df = art.df.copy()
        feature_cols, _ = self._get_feature_columns()

        X_all = art.pipeline.transform(df[feature_cols])
        proba_good = art.model.predict_proba(X_all)[:, 1]
        scores = np.array([self._map_prob_to_score(p) for p in proba_good])
        df["score"] = scores
        df["approved"] = df["score"] >= 750.0

        df["income_group"] = pd.qcut(
            df["income_monthly"], 4, labels=["Q1", "Q2", "Q3", "Q4"]
        )
        df["digital_adoption_group"] = pd.qcut(
            df["digital_adoption_score"], 3, labels=["low", "medium", "high"]
        )

        income_metrics = self._compute_group_fairness(
            df, group_col="income_group", ref_group="Q4"
        )
        digital_metrics = self._compute_group_fairness(
            df, group_col="digital_adoption_group", ref_group="high"
        )

        return FairnessResponse(
            income_quartiles=income_metrics,
            digital_adoption_groups=digital_metrics,
        )

    def get_feature_metadata(self) -> FeatureMetadataResponse:
        meta: list[FeatureMetadataItem] = [
            FeatureMetadataItem(
                key="ecom_txn_count",
                label="E-commerce transaction count",
                description="Number of monthly online transactions.",
                category="E-commerce",
            ),
            FeatureMetadataItem(
                key="ecom_spend",
                label="E-commerce monthly spend",
                description="Total amount spent online per month.",
                category="E-commerce",
            ),
            FeatureMetadataItem(
                key="ecom_refund_rate",
                label="Refund rate",
                description="Share of transactions that resulted in refunds or chargebacks.",
                category="E-commerce",
            ),
            FeatureMetadataItem(
                key="ecom_category_diversity",
                label="Category diversity",
                description="Number of distinct purchase categories.",
                category="E-commerce",
            ),
            FeatureMetadataItem(
                key="utility_on_time_ratio",
                label="On-time utility payments",
                description="Proportion of utility bills paid on or before due date.",
                category="Utility",
            ),
            FeatureMetadataItem(
                key="utility_avg_days_late",
                label="Average days late",
                description="Average days late when bills are overdue.",
                category="Utility",
            ),
            FeatureMetadataItem(
                key="utility_bill_volatility",
                label="Utility bill volatility",
                description="Variation in monthly utility spend.",
                category="Utility",
            ),
            FeatureMetadataItem(
                key="wallet_txn_count",
                label="Digital wallet transactions",
                description="Number of monthly digital wallet transactions.",
                category="Digital wallet",
            ),
            FeatureMetadataItem(
                key="wallet_txn_share",
                label="Digital wallet share",
                description="Share of total payments made via digital wallet.",
                category="Digital wallet",
            ),
            FeatureMetadataItem(
                key="wallet_balance_volatility",
                label="Wallet balance volatility",
                description="Variation in wallet balance over time.",
                category="Digital wallet",
            ),
            FeatureMetadataItem(
                key="income_monthly",
                label="Monthly income (synthetic)",
                description="Estimated monthly income from digital cash flows.",
                category="Cash flow",
            ),
            FeatureMetadataItem(
                key="inflow_volatility",
                label="Inflow volatility",
                description="Variability of incoming funds.",
                category="Cash flow",
            ),
            FeatureMetadataItem(
                key="outflow_volatility",
                label="Outflow volatility",
                description="Variability of outgoing payments.",
                category="Cash flow",
            ),
            FeatureMetadataItem(
                key="net_cash_margin",
                label="Net cash margin",
                description="Net cash surplus as share of inflows.",
                category="Cash flow",
            ),
            FeatureMetadataItem(
                key="sm_post_freq",
                label="Posting frequency",
                description="Average number of social posts per week.",
                category="Social media",
            ),
            FeatureMetadataItem(
                key="sm_engagement_score",
                label="Engagement score",
                description="Normalized likes/comments activity.",
                category="Social media",
            ),
            FeatureMetadataItem(
                key="sm_account_age_years",
                label="Account age",
                description="Age of social account in years.",
                category="Social media",
            ),
            FeatureMetadataItem(
                key="sm_activity_level",
                label="Activity level",
                description="Categorized activity (low/medium/high).",
                category="Social media",
            ),
        ]

        notes = {
            "data_minimization": "Only behavioral, non-sensitive digital signals are used. No protected attributes such as gender, race, or exact age are collected.",
            "consent_first": "The API refuses to score if consent is not explicitly provided with each request.",
            "explainability": "Each score is accompanied by the main behavioral drivers using SHAP-based explainability.",
            "no_sensitive_attributes": "Protected or sensitive attributes are intentionally excluded from the model and dataset.",
        }

        return FeatureMetadataResponse(features=meta, notes=notes)

    # ------------------ internal helpers ------------------ #

    def _generate_synthetic_data(self, n: int) -> pd.DataFrame:
        rng = np.random.default_rng(RANDOM_SEED)

        income = rng.lognormal(mean=10, sigma=0.4, size=n)
        ecom_txn = rng.poisson(lam=15, size=n)
        ecom_spend = income * rng.uniform(0.05, 0.3, size=n)
        ecom_refund_rate = np.clip(rng.beta(1.5, 15, size=n), 0, 0.4)
        ecom_cat_div = rng.integers(1, 10, size=n)

        utility_on_time = rng.beta(8, 2, size=n)
        utility_days_late = np.maximum(0, rng.normal(loc=2, scale=3, size=n))
        utility_vol = rng.lognormal(mean=2, sigma=0.5, size=n)

        wallet_txn = rng.poisson(lam=10, size=n)
        wallet_share = np.clip(rng.beta(2, 2, size=n), 0, 1)
        wallet_vol = rng.lognormal(mean=1, sigma=0.7, size=n)

        inflow_vol = rng.lognormal(mean=1, sigma=0.6, size=n)
        outflow_vol = rng.lognormal(mean=1, sigma=0.6, size=n)
        net_margin = rng.normal(loc=0.15, scale=0.1, size=n)

        sm_post_freq = rng.poisson(lam=5, size=n)
        sm_engagement = rng.lognormal(mean=0, sigma=0.7, size=n)
        sm_age = rng.uniform(0.5, 10, size=n)

        activity_level = np.where(
            sm_post_freq < 3,
            "low",
            np.where(sm_post_freq < 7, "medium", "high"),
        )

        digital_adoption = (
            0.4 * wallet_share
            + 0.3 * (ecom_txn / (ecom_txn.max() + 1e-6))
            + 0.3 * (sm_engagement / (sm_engagement.max() + 1e-6))
        )

        risk_score = (
            1.5 * ecom_refund_rate
            - 1.2 * utility_on_time
            + 0.05 * utility_days_late
            + 0.4 * (utility_vol / (utility_vol.max() + 1e-6))
            - 0.000002 * income
            - 0.8 * net_margin
            + 0.3 * (inflow_vol / (inflow_vol.max() + 1e-6))
            + 0.3 * (outflow_vol / (outflow_vol.max() + 1e-6))
            - 0.5 * digital_adoption
        )

        default_prob = 1 / (1 + np.exp(-(risk_score * 3)))
        defaulted = rng.binomial(1, p=np.clip(default_prob, 0.01, 0.8))

        df = pd.DataFrame(
            {
                "ecom_txn_count": ecom_txn,
                "ecom_spend": ecom_spend,
                "ecom_refund_rate": ecom_refund_rate,
                "ecom_category_diversity": ecom_cat_div,
                "utility_on_time_ratio": utility_on_time,
                "utility_avg_days_late": utility_days_late,
                "utility_bill_volatility": utility_vol,
                "wallet_txn_count": wallet_txn,
                "wallet_txn_share": wallet_share,
                "wallet_balance_volatility": wallet_vol,
                "income_monthly": income,
                "inflow_volatility": inflow_vol,
                "outflow_volatility": outflow_vol,
                "net_cash_margin": net_margin,
                "sm_post_freq": sm_post_freq,
                "sm_engagement_score": sm_engagement,
                "sm_account_age_years": sm_age,
                "sm_activity_level": activity_level,
                "digital_adoption_score": digital_adoption,
                "defaulted": defaulted,
            }
        )
        return df

    def _get_feature_columns(self) -> Tuple[List[str], List[str]]:
        feature_cols: list[str] = [
            "ecom_txn_count",
            "ecom_spend",
            "ecom_refund_rate",
            "ecom_category_diversity",
            "utility_on_time_ratio",
            "utility_avg_days_late",
            "utility_bill_volatility",
            "wallet_txn_count",
            "wallet_txn_share",
            "wallet_balance_volatility",
            "income_monthly",
            "inflow_volatility",
            "outflow_volatility",
            "net_cash_margin",
            "sm_post_freq",
            "sm_engagement_score",
            "sm_account_age_years",
            "sm_activity_level",
        ]
        cat_cols: list[str] = ["sm_activity_level"]
        return feature_cols, cat_cols

    def _request_to_df(self, req: ScoreRequest) -> pd.DataFrame:
        data = req.model_dump()
        data.pop("consent", None)
        return pd.DataFrame([data])

    def _map_prob_to_score(self, p_good: float) -> float:
        p = float(np.clip(p_good, 0.0, 1.0))
        return 300.0 + p * 600.0

    def _score_to_band(self, score: float) -> str:
        if score >= 800:
            return "Very Low"
        if score >= 750:
            return "Low"
        if score >= 700:
            return "Medium"
        if score >= 650:
            return "High"
        return "Very High"

    def _get_instance_shap(
        self, raw_df: pd.DataFrame, X_transformed: Any
    ) -> list[ShapExplanation]:
        art = self._require_artifacts()
        shap_vals = art.explainer.shap_values(X_transformed)
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[1]
        vals = shap_vals[0]
        feature_names = self._get_transformed_feature_names()
        abs_vals = np.abs(vals)
        top_idx = np.argsort(abs_vals)[::-1][:3]

        explanations: list[ShapExplanation] = []
        for idx in top_idx:
            key = feature_names[idx]
            label = self._pretty_label_from_feature_key(key)
            shap_value = float(vals[idx])
            impact = "reduces risk" if shap_value < 0 else "increases risk"
            explanations.append(
                ShapExplanation(
                    feature_key=key,
                    feature_label=label,
                    value="n/a",
                    shap_value=shap_value,
                    impact=impact,
                )
            )
        return explanations

    def _get_transformed_feature_names(self) -> list[str]:
        art = self._require_artifacts()
        pre: ColumnTransformer = art.pipeline.named_steps["pre"]  # type: ignore[assignment]
        feat_names: list[str] = []
        for name, trans, cols in pre.transformers_:
            if name == "remainder":
                continue
            if hasattr(trans, "get_feature_names_out"):
                sub_names = list(trans.get_feature_names_out(cols))  # type: ignore[arg-type]
            else:
                sub_names = list(cols)
            feat_names.extend(sub_names)
        return feat_names

    def _pretty_label_from_feature_key(self, key: str) -> str:
        for prefix in ("num__", "cat__", "pre__"):
            if key.startswith(prefix):
                key = key[len(prefix) :]
        if "sm_activity_level" in key:
            level = key.split("_")[-1]
            return f"Social media activity = {level}"
        mapping = {
            "ecom_txn_count": "E-commerce transaction count",
            "ecom_spend": "E-commerce monthly spend",
            "ecom_refund_rate": "Refund rate",
            "ecom_category_diversity": "Category diversity",
            "utility_on_time_ratio": "On-time utility payments",
            "utility_avg_days_late": "Average days late",
            "utility_bill_volatility": "Utility bill volatility",
            "wallet_txn_count": "Digital wallet transactions",
            "wallet_txn_share": "Digital wallet share",
            "wallet_balance_volatility": "Wallet balance volatility",
            "income_monthly": "Monthly income",
            "inflow_volatility": "Inflow volatility",
            "outflow_volatility": "Outflow volatility",
            "net_cash_margin": "Net cash margin",
            "sm_post_freq": "Posting frequency",
            "sm_engagement_score": "Engagement score",
            "sm_account_age_years": "Social account age",
        }
        return mapping.get(key, key)

    def _compute_group_fairness(
        self, df: pd.DataFrame, group_col: str, ref_group: str
    ) -> list[FairnessGroupMetrics]:
        groups: list[FairnessGroupMetrics] = []
        ref_approval: Optional[float] = None

        for g, sub in df.groupby(group_col):
            g_str = str(g)
            n = len(sub)
            if n == 0:
                continue
            approval_rate = float(sub["approved"].mean())
            if g_str == ref_group:
                ref_approval = approval_rate

        for g, sub in df.groupby(group_col):
            g_str = str(g)
            n = len(sub)
            if n == 0:
                continue
            approval_rate = float(sub["approved"].mean())
            avg_score = float(sub["score"].mean())
            dir_val: Optional[float] = None
            if ref_approval is not None and ref_approval > 0:
                dir_val = float(approval_rate / ref_approval)
            groups.append(
                FairnessGroupMetrics(
                    group=g_str,
                    n=int(n),
                    avg_score=avg_score,
                    approval_rate=approval_rate,
                    disparate_impact_ratio=dir_val,
                )
            )
        return groups

    def _require_artifacts(self) -> TrainedArtifacts:
        if self.artifacts is None:
            raise RuntimeError("Model not trained yet")
        return self.artifacts

