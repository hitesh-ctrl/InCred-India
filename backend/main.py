from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from model_service import MODEL_VERSION, ModelService
from schemas import (
    DistributionsResponse,
    FairnessResponse,
    FeatureMetadataResponse,
    PortfolioKpis,
    ScoreRequest,
    ScoreResponse,
)


app = FastAPI(title="Alt Credit Scoring Demo", version=MODEL_VERSION)
model_service = ModelService()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    model_service.train_at_startup()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model_version": MODEL_VERSION}


@app.post("/score", response_model=ScoreResponse)
def score(req: ScoreRequest) -> ScoreResponse:
    if not req.consent:
        raise HTTPException(
            status_code=400,
            detail="Consent is required to compute a credit score.",
        )
    try:
        return model_service.score(req)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - generic safety net
        raise HTTPException(status_code=500, detail="Scoring failed") from exc


@app.get("/dashboard/portfolio-kpis", response_model=PortfolioKpis)
def get_portfolio_kpis() -> PortfolioKpis:
    return model_service.get_portfolio_kpis()


@app.get("/dashboard/distributions", response_model=DistributionsResponse)
def get_distributions() -> DistributionsResponse:
    return model_service.get_distributions()


@app.get("/dashboard/global-shap")
def get_global_shap():
    # Response model omitted here because SHAP may return numpy types; FastAPI will coerce.
    return model_service.get_global_shap()


@app.get("/dashboard/fairness", response_model=FairnessResponse)
def get_fairness() -> FairnessResponse:
    return model_service.get_fairness()


@app.get("/config/feature-metadata", response_model=FeatureMetadataResponse)
def get_feature_metadata() -> FeatureMetadataResponse:
    return model_service.get_feature_metadata()


__all__ = ["app"]

