"""
backend/main.py  —  AnomalyIQ FastAPI Backend
Run: uvicorn main:app --reload --port 8000
"""
import io
import os
import json
import asyncio
import numpy as np
import pandas as pd

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional

# ── internal imports ──────────────────────────────────────────────────────────
import sys
sys.path.insert(0, os.path.dirname(__file__))

from utils.preprocessor   import detect_dataset_type, get_dataset_summary, preprocess
from utils.scorer         import combine_scores, build_results_df, compute_metrics, assign_risk
from utils.model_manager  import (save_models, load_models,
                                   available_models, model_exists)
from utils.explainability import (compute_shap_values,
                                   explain_single_transaction)
from models.autoencoder_model     import (build_autoencoder, train_autoencoder,
                                           compute_reconstruction_errors, compute_threshold)
from models.isolation_forest_model import (train_isolation_forest,
                                            compute_isolation_scores)
from models.lightgbm_model         import train_lightgbm, predict_lightgbm
from sklearn.preprocessing import MinMaxScaler

# ── app ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AnomalyIQ API",
    description="Intelligent Fraud Detection — Three-Stage Hybrid Model",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_headers(request, call_next):
    response = await call_next(request)
    response.headers["ngrok-skip-browser-warning"] = "true"
    return response

# In-memory state (resets on server restart — use Redis for production)
pipeline_state: dict = {}
training_progress: dict = {}


# ── MODELS ────────────────────────────────────────────────────────────────────
class TrainRequest(BaseModel):
    dataset_type: Optional[str] = None  # auto-detect if None
    epochs:       int   = 50
    batch_size:   int   = 256
    w_ae:         float = 0.20
    w_if:         float = 0.20
    w_lgbm:       float = 0.60
    threshold_pct: int  = 95
    contamination: float = 0.002


class ScoreRequest(BaseModel):
    features: dict  # {col_name: value}
    dataset_type: str = 'creditcard'


# ── ROUTES ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "AnomalyIQ API v2.0 — Three-Stage Hybrid Fraud Detection"}


@app.get("/api/health")
def health():
    return {"status": "ok", "models_available": available_models()}


@app.get("/api/models")
def get_models():
    return {"models": available_models()}


@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a CSV dataset and get a preview + summary."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400,
                            detail="Only CSV files are accepted.")
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400,
                            detail=f"Could not parse CSV: {e}")
    try:
        dtype = detect_dataset_type(df)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    summary = get_dataset_summary(df, dtype)

    # Save temporarily relative to this file's location
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    tmp_dir = os.path.join(backend_dir, "tmp_data")
    os.makedirs(tmp_dir, exist_ok=True)
    save_path = os.path.join(tmp_dir, f"upload_{dtype}.csv")
    df.to_csv(save_path, index=False)

    preview = df.head(5).fillna('').to_dict(orient='records')
    return {
        "message":      "Dataset uploaded successfully",
        "dataset_type": dtype,
        "summary":      summary,
        "preview":      preview,
        "columns":      list(df.columns),
        "saved_path":   save_path,
    }


@app.post("/api/train")
async def train_pipeline(req: TrainRequest,
                         background_tasks: BackgroundTasks):
    """Start training pipeline in background. Poll /api/progress for updates."""
    dtype = req.dataset_type or 'creditcard'
    training_progress[dtype] = {
        "status":   "starting",
        "stage":    0,
        "message":  "Initialising pipeline...",
        "percent":  0,
    }
    background_tasks.add_task(_run_training, req, dtype)
    return {"message": f"Training started for {dtype}", "dataset_type": dtype}


@app.get("/api/progress/{dataset_type}")
def get_progress(dataset_type: str):
    prog = training_progress.get(dataset_type, {"status": "not_started"})
    return prog


@app.get("/api/results/{dataset_type}")
def get_results(dataset_type: str):
    state = pipeline_state.get(dataset_type)
    if not state:
        raise HTTPException(status_code=404,
                            detail="No results found. Run /api/train first.")
    return state


@app.post("/api/score")
def score_transaction(req: ScoreRequest):
    """Score a single transaction in real time."""
    dtype = req.dataset_type
    if not model_exists(dtype):
        raise HTTPException(status_code=404,
                            detail=f"No trained model found for '{dtype}'. "
                                    "Please train the model first.")
    ae, ifm, lgbm, sc, meta = load_models(dtype)
    feat_cols = meta['feature_cols']

    row = np.zeros(len(feat_cols), dtype='float32')
    for i, col in enumerate(feat_cols):
        if col in req.features:
            row[i] = float(req.features[col])

    X = row.reshape(1, -1)
    ae_err  = float(compute_reconstruction_errors(ae, X)[0])
    if_sc   = float(compute_isolation_scores(ifm, X)[0])
    lgbm_p  = float(predict_lightgbm(lgbm, sc, X,
                                      np.array([ae_err]),
                                      np.array([if_sc]))[0])
    nm      = MinMaxScaler()
    ae_norm = float(nm.fit_transform(np.array([[ae_err]]))[0][0])
    combined = float(np.clip(0.20*ae_norm + 0.20*if_sc + 0.60*lgbm_p, 0, 1))
    risk    = assign_risk(combined)

    return {
        "ae_error":           round(ae_err,  4),
        "isolation_score":    round(if_sc,   4),
        "lgbm_probability":   round(lgbm_p,  4),
        "combined_score":     round(combined,4),
        "risk_level":         risk,
        "is_anomaly":         combined >= 0.50,
        "recommendation":     _recommend(risk),
    }


@app.get("/api/export/{dataset_type}")
def export_results(dataset_type: str, flagged_only: bool = False):
    """Download results as CSV."""
    state = pipeline_state.get(dataset_type)
    if not state or 'results' not in state:
        raise HTTPException(status_code=404, detail="No results to export.")
    rows  = state['results']
    df    = pd.DataFrame(rows)
    if flagged_only:
        df = df[df['is_anomaly'] == 1]
    buf  = io.StringIO()
    df.to_csv(buf, index=True)
    buf.seek(0)
    fname = f"anomalyiq_{dataset_type}_{'flagged' if flagged_only else 'full'}.csv"
    return StreamingResponse(
        io.BytesIO(buf.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )



@app.get("/api/explain/{dataset_type}")
def get_shap_explanation(dataset_type: str):
    """Get global SHAP feature importance for the trained LightGBM model."""
    state = pipeline_state.get(dataset_type)
    if not state:
        raise HTTPException(status_code=404,
                            detail="No results found. Run /api/train first.")
    shap_data = state.get('shap_global', [])
    return {
        "dataset_type":     dataset_type,
        "shap_importance":  shap_data,
        "available":        len(shap_data) > 0,
        "note": "SHAP values show the average contribution of each feature to fraud detection across all analysed transactions."
    }


@app.post("/api/explain/transaction")
def explain_transaction(req: ScoreRequest):
    """Explain a single transaction using SHAP values."""
    dtype = req.dataset_type
    if not model_exists(dtype):
        raise HTTPException(status_code=404,
                            detail=f"No trained model for '{dtype}'. Train first.")
    ae, ifm, lgbm, sc, meta = load_models(dtype)
    feat_cols = meta['feature_cols']

    row = np.zeros(len(feat_cols), dtype='float32')
    for i, col in enumerate(feat_cols):
        if col in req.features:
            row[i] = float(req.features[col])
    X_single = row.reshape(1, -1)

    ae_err = float(compute_reconstruction_errors(ae, X_single)[0])
    if_sc  = float(compute_isolation_scores(ifm, X_single)[0])
    lgbm_p = float(predict_lightgbm(lgbm, sc, X_single,
                                     np.array([ae_err]),
                                     np.array([if_sc]))[0])

    contribs = explain_single_transaction(
        lgbm, sc, X_single, ae_err, if_sc, feat_cols)

    nm = MinMaxScaler()
    ae_norm  = float(nm.fit_transform(np.array([[ae_err]]))[0][0])
    combined = float(np.clip(0.20*ae_norm + 0.20*if_sc + 0.60*lgbm_p, 0, 1))
    risk     = assign_risk(combined)

    return {
        "combined_score":       round(combined, 4),
        "risk_level":           risk,
        "ae_error":             round(ae_err, 4),
        "isolation_score":      round(if_sc,  4),
        "lgbm_probability":     round(lgbm_p, 4),
        "is_anomaly":           combined >= 0.50,
        "recommendation":       _recommend(risk),
        "shap_contributions":   contribs,
        "explanation_summary":  _build_explanation(contribs, risk),
    }


def _build_explanation(contribs: list, risk: str) -> str:
    if not contribs:
        return "Explanation unavailable — install the shap library for detailed explanations."
    top = [c for c in contribs if c['direction'] == 'increases_risk'][:3]
    if not top:
        return f"This transaction was classified as {risk} risk. No single feature strongly indicated fraud."
    names = ", ".join([c['feature'] for c in top])
    return (f"This transaction was flagged as {risk} risk. "
            f"The strongest fraud indicators were: {names}. "
            f"These features contributed most to the LightGBM fraud probability score.")


# ── BACKGROUND TRAINING ───────────────────────────────────────────────────────
def _update_progress(dtype, stage, percent, message, status="running"):
    training_progress[dtype] = {
        "status":  status,
        "stage":   stage,
        "message": message,
        "percent": percent,
    }


async def _run_training(req: TrainRequest, dtype: str):
    import asyncio
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _train_sync, req, dtype)


def _train_sync(req: TrainRequest, dtype: str):
    try:
        # Load data
        _update_progress(dtype, 1, 5, "Loading dataset...")
        # Resolve paths relative to backend directory AND project root
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        project_dir = os.path.dirname(backend_dir)

        candidates = [
            os.path.join(backend_dir, "tmp_data", f"upload_{dtype}.csv"),
            os.path.join(project_dir, "tmp_data", f"upload_{dtype}.csv"),
            os.path.join(backend_dir, "data", f"{dtype}.csv"),
            os.path.join(project_dir, "data", f"{dtype}.csv"),
            os.path.join(project_dir, "data", "creditcard.csv") if dtype == "creditcard" else None,
            os.path.join(project_dir, "data", "paysim.csv") if dtype == "paysim" else None,
            # Also check user's anomaly_detection_system data folder
            os.path.expanduser(f"~/OneDrive/Documents/anomaly_detection_system/data/{dtype}.csv"),
            os.path.expanduser(f"~/OneDrive/Documents/anomaly_detection_system/data/creditcard.csv") if dtype == "creditcard" else None,
            os.path.expanduser(f"~/OneDrive/Documents/anomaly_detection_system/data/paysim.csv") if dtype == "paysim" else None,
        ]
        path = None
        for c in candidates:
            if c and os.path.exists(c):
                path = c
                break
        if not path:
            raise FileNotFoundError(
                f"Could not find {dtype} dataset. "
                f"Please upload it via the Load Data page or place it in the data/ folder."
            )
        df = pd.read_csv(path)

        # Preprocess
        _update_progress(dtype, 2, 12, "Preprocessing and feature engineering...")
        (X_train, X_test, y_test, feat_cols, full_X, full_y), _ = preprocess(df, dtype)
        _update_progress(dtype, 2, 18,
            f"Preprocessed — Train: {len(X_train):,} | Test: {len(X_test):,} | Features: {X_train.shape[1]}")

        # Autoencoder
        _update_progress(dtype, 3, 20, "Training Autoencoder neural network...")
        ae_model  = build_autoencoder(X_train.shape[1])
        history   = train_autoencoder(ae_model, X_train,
                                       epochs=req.epochs,
                                       batch_size=req.batch_size)
        train_err = compute_reconstruction_errors(ae_model, X_train)
        threshold = compute_threshold(train_err, req.threshold_pct)
        test_err  = compute_reconstruction_errors(ae_model, X_test)
        full_err  = compute_reconstruction_errors(ae_model, full_X)
        ep = len(history.history['loss'])
        _update_progress(dtype, 3, 45,
            f"Autoencoder trained — Epochs: {ep} | Loss: {history.history['loss'][-1]:.5f}")

        # Isolation Forest
        _update_progress(dtype, 4, 47, "Running Isolation Forest...")
        if_model       = train_isolation_forest(X_test,
                            contamination=req.contamination)
        if_scores      = compute_isolation_scores(if_model, X_test)
        if_model_full  = train_isolation_forest(full_X,
                            contamination=req.contamination)
        if_scores_full = compute_isolation_scores(if_model_full, full_X)
        _update_progress(dtype, 4, 60, "Isolation Forest complete")

        # LightGBM + SMOTE
        _update_progress(dtype, 5, 62,
            "Applying SMOTE and training LightGBM classifier...")
        lgbm_model, lgbm_scaler = train_lightgbm(
            full_X, full_y, full_err, if_scores_full)
        lgbm_proba = predict_lightgbm(
            lgbm_model, lgbm_scaler, X_test, test_err, if_scores)
        _update_progress(dtype, 5, 80, "LightGBM training complete")

        # Score combination
        _update_progress(dtype, 6, 82, "Combining scores and classifying...")
        combined   = combine_scores(test_err, if_scores, lgbm_proba,
                                     req.w_ae, req.w_if, req.w_lgbm)
        results_df = build_results_df(test_err, if_scores,
                                       lgbm_proba, combined, y_test)
        y_pred     = (combined >= 0.50).astype(int)
        metrics    = compute_metrics(y_test, y_pred, combined)

        # Standalone metrics for comparison
        from sklearn.preprocessing import MinMaxScaler as MMS
        ae_pred  = (test_err > threshold).astype(int)
        sc2      = MMS()
        if_pred  = (sc2.fit_transform(if_scores.reshape(-1,1)).flatten() >= 0.5).astype(int)
        metrics_ae = compute_metrics(y_test, ae_pred, test_err)
        metrics_if = compute_metrics(y_test, if_pred, if_scores)

        # Training loss history
        loss_history = {
            'train': [round(v, 6) for v in history.history['loss']],
            'val':   [round(v, 6) for v in history.history['val_loss']],
        }

        # Risk distribution
        risk_dist = results_df['risk_level'].value_counts().to_dict()

        # Save models
        _update_progress(dtype, 7, 90, "Saving trained models...")
        save_models(dtype, ae_model, if_model, lgbm_model,
                    lgbm_scaler, threshold, feat_cols, metrics)

        # SHAP global explainability
        _update_progress(dtype, 7, 91, "Computing SHAP explainability...")
        try:
            shap_global, sv, X_shap, shap_cols = compute_shap_values(
                lgbm_model, lgbm_scaler, X_test, test_err, if_scores,
                feat_cols, max_samples=300)
        except Exception as shap_err:
            shap_global = []
            print(f"SHAP warning (non-critical): {shap_err}")

        # Feature importance
        all_cols = list(feat_cols) + ['ae_score', 'if_score']
        n = min(len(lgbm_model.feature_importances_), len(all_cols))
        feat_imp = sorted(
            [{'feature': all_cols[i], 'importance': int(lgbm_model.feature_importances_[i])}
             for i in range(n)],
            key=lambda x: x['importance'], reverse=True
        )[:15]

        # Store full state
        pipeline_state[dtype] = {
            'metrics':          metrics,
            'metrics_ae':       metrics_ae,
            'metrics_if':       metrics_if,
            'loss_history':     loss_history,
            'risk_distribution': risk_dist,
            'feature_importance': feat_imp,
            'ae_threshold':     float(threshold),
            'total_records':    len(results_df),
            'flagged_count':    int(results_df['is_anomaly'].sum()),
            'results':          results_df.head(1000).fillna(0).to_dict(orient='records'),
            'dataset_type':     dtype,
            'shap_global':      shap_global or [],
        }
        _update_progress(dtype, 8, 100,
            f"Pipeline complete — Precision: {metrics['precision']:.2%} | "
            f"AUC-ROC: {metrics['auc_roc']:.2%}",
            status="complete")

    except Exception as e:
        import traceback
        _update_progress(dtype, 0, 0, f"Error: {str(e)}", status="error")
        print(traceback.format_exc())


def _recommend(risk: str) -> str:
    return {
        'High':   'Escalate immediately to senior compliance officer.',
        'Medium': 'Assign for review within 24 hours.',
        'Low':    'Log for periodic review.',
        'Normal': 'No action required.',
    }.get(risk, 'No action required.')
# Auth routes
from auth import (init_db, register_user, login_user, get_profile,
                  get_audit_logs, get_current_user,
                  RegisterRequest, LoginRequest)
from fastapi import Depends

@app.on_event("startup")
def startup_event():
    init_db()

@app.post("/api/auth/register")
def auth_register(req: RegisterRequest):
    return register_user(req)

@app.post("/api/auth/login")
def auth_login(req: LoginRequest):
    return login_user(req)

@app.get("/api/auth/profile")
def auth_profile(cu: dict = Depends(get_current_user)):
    return get_profile(cu)

@app.post("/api/auth/logout")
def auth_logout(cu: dict = Depends(get_current_user)):
    return {"message": "Logged out."}

# ============================================================================
# ADD THIS CODE TO YOUR main.py FILE
# ============================================================================
# Copy everything below this line and paste it at the END of your main.py file
# (before the last line if you have any)
# ============================================================================

from fastapi import UploadFile, File, Form
from pydantic import BaseModel
from datetime import datetime
import pandas as pd

# ============================================================================
# ENDPOINT 1: Upload Dataset
# ============================================================================
@app.post("/api/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_type: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload and save dataset file
    Returns file_path and basic info
    """
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files allowed")
        
        # Create upload directory
        upload_dir = os.path.join(os.getcwd(), "uploaded_datasets")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{dataset_type}_{timestamp}_{file.filename}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Get basic info
        try:
            df = pd.read_csv(file_path)
            rows = len(df)
            columns = len(df.columns)
        except:
            rows = None
            columns = None
        
        return {
            "status": "success",
            "file_path": file_path,
            "filename": file.filename,
            "rows": rows,
            "columns": columns,
            "dataset_type": dataset_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENDPOINT 2: Run Detection
# ============================================================================
class DetectionRequest(BaseModel):
    file_path: str
    dataset_type: str

@app.post("/api/detect")
async def run_detection(
    request: DetectionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Run three-stage detection pipeline
    Returns results with metrics and flagged transactions
    """
    try:
        from utils.model_manager import ModelManager
        from utils.preprocessor import preprocess_data
        from utils.scorer import calculate_metrics
        
        # Validate file
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Load data
        df = pd.read_csv(request.file_path)
        X_processed, y_true = preprocess_data(df, request.dataset_type)
        
        # Run detection
        manager = ModelManager(dataset_type=request.dataset_type)
        results = manager.detect(X_processed)
        
        # Calculate metrics
        metrics = calculate_metrics(y_true, results['predictions'])
        
        # Get flagged transactions
        flagged = df[results['predictions'] == 1].head(100)
        
        return {
            "status": "success",
            "metrics": {
                "precision": float(metrics['precision']),
                "recall": float(metrics['recall']),
                "f1_score": float(metrics['f1']),
                "auc_roc": float(metrics['auc_roc']),
                "accuracy": float(metrics.get('accuracy', 0))
            },
            "confusion_matrix": {
                "tn": int(metrics['tn']),
                "fp": int(metrics['fp']),
                "fn": int(metrics['fn']),
                "tp": int(metrics['tp'])
            },
            "total_transactions": len(df),
            "total_flagged": int(sum(results['predictions'])),
            "flagged_transactions": flagged.to_dict('records')[:10]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


# ============================================================================
# END OF CODE TO ADD
# ============================================================================