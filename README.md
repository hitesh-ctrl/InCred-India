## Alt Credit Scoring Demo (FastAPI + React)

This is a local-only fintech prototype demonstrating **AI-powered alternate credit scoring** using synthetic behavioral data:

- E-commerce activity
- Utility payment behavior
- Digital wallet usage
- Cash-flow stability
- Social media engagement

The system enforces **consent-first scoring**, **no protected attributes**, **SHAP-based explainability**, and a **fairness dashboard** across income quartiles and digital adoption groups.

---

### 1. Backend (FastAPI)

#### Install dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # on macOS/Linux
pip install -r requirements.txt
```

#### Run the API

```bash
cd backend
uvicorn main:app --reload
```

On startup the backend will:

- Generate a 10k-row synthetic dataset
- Train an XGBoost model with SMOTE-balanced classes
- Compute validation AUC
- Initialize a SHAP explainer
- Precompute metrics for dashboard and fairness endpoints

Main endpoints:

- `GET /health` – service + model version
- `POST /score` – scoring with consent enforcement
- `GET /dashboard/portfolio-kpis`
- `GET /dashboard/distributions`
- `GET /dashboard/global-shap`
- `GET /dashboard/fairness`
- `GET /config/feature-metadata`

---

### 2. Frontend (React + Vite + Tailwind)

#### Install dependencies

```bash
cd frontend
npm install
```

#### Run the dev server

```bash
cd frontend
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

Pages:

- `/` – overview of the solution
- `/score` – scoring demo with consent checkbox and SHAP explanations
- `/dashboard` – portfolio KPIs, score/risk distributions, global SHAP, fairness audit
- `/responsible-ai` – privacy & responsible AI panel with data minimization and consent-first explanations

Make sure the backend is running at `http://localhost:8000` so the frontend can talk to it.

---

### 3. Notes

- Data is **fully synthetic** and for demonstration only.
- All state (data, model, SHAP, fairness metrics) is held **in-memory**; there is no database or external persistence.
- No authentication is implemented, per hackathon constraints.

