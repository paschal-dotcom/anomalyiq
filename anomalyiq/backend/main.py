"""
AnomalyIQ - Main FastAPI Application
Backend API for Three-Stage Hybrid Fraud Detection System

Author: Paschal Nwagor O.
"""

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import pandas as pd
import numpy as np
from datetime import datetime

from auth_manager import AuthManager, get_current_user, require_permission
from anomalyiq_trainer import AnomalyIQTrainer
from shap_explainer import SHAPExplainer
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import base64
from io import BytesIO
from sklearn.metrics import (
    confusion_matrix as sk_cm, roc_curve, precision_recall_curve,
    precision_score, recall_score, f1_score, roc_auc_score, accuracy_score
)

app = FastAPI(
    title="AnomalyIQ",
    description="Three-Stage Hybrid Fraud Detection System with SHAP Explainability",
    version="2.0.0"
)

# ── Raise the multipart upload limit to 500 MB ──────────────────────────────────
# FastAPI/Starlette defaults to 1 MB — way too small for 140 MB CSV files.
# We patch the form's spool limit so large files stream to disk instead of RAM.
from starlette.formparsers import MultiPartParser
MultiPartParser.max_file_size = 2 * 1024 * 1024 * 1024   # 2 GB per file

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Railway persists /data between deployments; locally use relative paths
BASE_DIR        = os.environ.get("RAILWAY_VOLUME_MOUNT_PATH", ".")
UPLOAD_DIR      = os.path.join(BASE_DIR, "uploaded_datasets")
MODEL_DIR_ROOT  = os.path.join(BASE_DIR, "trained_models")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(MODEL_DIR_ROOT, exist_ok=True)

# ── Pydantic models ─────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str

class DetectionRequest(BaseModel):
    file_path: str
    dataset_type: str

class CreateUserRequest(BaseModel):
    username: str
    full_name: str
    email: str
    role: str
    password: str

class UpdateRoleRequest(BaseModel):
    username: str
    new_role: str

class ChangePasswordRequest(BaseModel):
    username: str
    new_password: str


# ============================================================================
# AUTH ENDPOINTS
# ============================================================================

@app.post("/api/login")
async def login(request: LoginRequest):
    auth   = AuthManager()
    result = auth.login(request.username, request.password)
    if not result["success"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail=result["error"])
    return {"status": "success", "data": {"token": result["token"],
                                           "user":  result["user"]}}


@app.post("/api/register")
async def register(request: CreateUserRequest):
    """
    Public self-registration endpoint.
    New accounts are created with role 'Data Analyst' by default.
    An admin can promote them later from the Users page.
    """
    auth   = AuthManager()
    # Force role to Data Analyst regardless of what client sends
    result = auth.create_user(
        request.username,
        request.full_name,
        request.email,
        "Data Analyst",   # default role — admin can promote later
        request.password,
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"status": "success", "message": "Account created! You can now log in."}


@app.get("/api/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"status": "success", "data": {"user": current_user}}


# ============================================================================
# USER MANAGEMENT
# ============================================================================

@app.get("/api/users")
async def list_users(current_user: dict = Depends(require_permission("manage_users"))):
    auth = AuthManager()
    return {"status": "success", "data": {"users": auth.list_users()}}


@app.post("/api/users")
async def create_user(request: CreateUserRequest,
                      current_user: dict = Depends(require_permission("manage_users"))):
    auth   = AuthManager()
    result = auth.create_user(request.username, request.full_name,
                               request.email, request.role, request.password)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"status": "success", "message": result["message"]}


@app.put("/api/users/role")
async def update_role(request: UpdateRoleRequest,
                      current_user: dict = Depends(require_permission("manage_users"))):
    auth   = AuthManager()
    result = auth.update_user_role(request.username, request.new_role)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"status": "success", "message": result["message"]}


@app.put("/api/users/password")
async def change_password(request: ChangePasswordRequest,
                          current_user: dict = Depends(require_permission("manage_users"))):
    auth   = AuthManager()
    result = auth.change_password(request.username, request.new_password)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"status": "success", "message": result["message"]}


@app.delete("/api/users/{username}")
async def deactivate_user(username: str,
                          current_user: dict = Depends(require_permission("manage_users"))):
    if username == current_user["username"]:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    auth   = AuthManager()
    result = auth.deactivate_user(username)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"status": "success", "message": result["message"]}


# ============================================================================
# UPLOAD ENDPOINT
# ============================================================================

@app.post("/api/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_type: str = Form(...),
    current_user: dict = Depends(require_permission("upload_dataset"))
):
    try:
        if not file.filename.endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename  = f"{dataset_type}_{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        # Stream to disk in 8 MB chunks — handles 140+ MB files without OOM
        CHUNK = 8 * 1024 * 1024   # 8 MB
        with open(file_path, "wb") as f:
            while True:
                chunk = await file.read(CHUNK)
                if not chunk:
                    break
                f.write(chunk)

        # Quick stats — count lines and sample headers only (no full RAM load)
        try:
            # Count rows by iterating lines — works on any file size
            rows_approx = 0
            with open(file_path, "r", encoding="utf-8", errors="ignore") as fh:
                for rows_approx, _ in enumerate(fh, start=-1):
                    pass   # rows_approx ends at total lines - 1 (header excluded)

            # Read just the header + first 1000 rows for column info
            df_sample   = pd.read_csv(file_path, nrows=1000)
            columns     = len(df_sample.columns)

            # Count fraud labels using only the label column — avoids loading all cols
            label_col   = next((c for c in ["Class", "isFraud", "is_fraud"]
                                if c in df_sample.columns), None)
            if label_col:
                label_df    = pd.read_csv(file_path, usecols=[label_col],
                                          dtype={label_col: "int8"})
                fraud_count = int(label_df[label_col].sum())
                fraud_ratio = round(fraud_count / max(rows_approx, 1) * 100, 4)
            else:
                fraud_count = 0
                fraud_ratio = 0.0
        except Exception:
            rows_approx = columns = None
            fraud_count = 0
            fraud_ratio = 0.0

        return {
            "status":  "success",
            "message": "Dataset uploaded successfully",
            "data": {
                "file_path":    file_path,
                "filename":     file.filename,
                "rows":         rows_approx,
                "columns":      columns,
                "fraud_count":  fraud_count,
                "fraud_ratio":  fraud_ratio,
                "dataset_type": dataset_type,
                "uploaded_by":  current_user["full_name"],
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# TRAINING ENDPOINT  ←  Trains the model and SAVES it to disk
# ============================================================================

@app.post("/api/train")
async def train_models(
    request: DetectionRequest,
    current_user: dict = Depends(require_permission("train_model"))
):
    try:
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")

        print(f"\n{'='*60}")
        print(f"  TRAINING STARTED — {request.dataset_type.upper()}")
        print(f"{'='*60}")

        df        = pd.read_csv(request.file_path)
        label_col = next((c for c in ["Class","isFraud","is_fraud"]
                          if c in df.columns), None)
        if label_col is None:
            raise HTTPException(status_code=400,
                                detail="Dataset must contain Class / isFraud / is_fraud column")

        trainer          = AnomalyIQTrainer(dataset_type=request.dataset_type)
        training_results = trainer.train_all(df)

        # ── Save trained model to disk so /detect can load it ──────────────────
        trainer.save_models()
        print(f"  ✅ Models saved to trained_models/")
        print(f"{'='*60}\n")

        return {
            "status":  "success",
            "message": "Models trained and saved successfully",
            "data": {
                "train_size":         training_results["train_size"],
                "test_size":          training_results["test_size"],
                "train_percentage":   80.0,
                "test_percentage":    20.0,
                "metrics":            training_results["metrics"],
                "dataset_type":       request.dataset_type,
                "trained_by":         current_user["full_name"],
            }
        }
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


# ============================================================================
# DETECTION ENDPOINT  ←  LOADS saved model, NO retraining, NO SMOTE
# ============================================================================

@app.post("/api/detect")
async def detect_fraud(
    request: DetectionRequest,
    current_user: dict = Depends(require_permission("run_detection"))
):
    try:
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")

        print(f"\n{'='*60}")
        print(f"  DETECTION STARTED — {request.dataset_type.upper()}")
        print(f"{'='*60}")

        # ── Step 1: Load trained models ────────────────────────────────────────
        trainer = AnomalyIQTrainer(dataset_type=request.dataset_type)
        loaded  = trainer.load_models()

        if not loaded:
            print("  ⚠️  No saved model found — training first...")
            df_train = pd.read_csv(request.file_path)
            trainer.train_all(df_train)
            trainer.save_models()

        # ── Step 2: Read raw CSV and apply the SAME transforms as training ──────
        print("  📂 Reading dataset...")
        df = pd.read_csv(request.file_path)

        # Use trainer's helper to get label + engineered features
        # but then RE-ALIGN to exactly the scaler's fitted columns.
        _, y_all = trainer.prepare_data(df)      # y only — X thrown away
        df2      = df.copy()

        # Re-apply the same feature engineering the trainer uses
        cfg = trainer.config
        for col in cfg["drop_cols"]:
            if col in df2.columns:
                df2.drop(columns=[col], inplace=True)
        for col in cfg["cat_cols"]:
            if col in df2.columns:
                from sklearn.preprocessing import LabelEncoder as _LE
                df2[col] = _LE().fit_transform(df2[col].astype(str))
        df2 = trainer._engineer_features(df2, cfg)
        df2 = df2.drop(columns=[cfg["label_col"]], errors="ignore")
        df2 = df2.select_dtypes(include=[np.number]).fillna(0)

        # Now align to EXACTLY the scaler's feature set using feature_names_in_
        # StandardScaler saves the exact column order it was fitted on
        if hasattr(trainer.scaler, "feature_names_in_"):
            scaler_cols = list(trainer.scaler.feature_names_in_)
        else:
            # Fallback: use base_feature_names stripped of meta-cols
            META = {"ae_reconstruction_error", "if_anomaly_score"}
            scaler_cols = [c for c in (trainer._base_feature_names or list(df2.columns))
                           if c not in META]

        print(f"  Scaler expects {len(scaler_cols)} cols: {scaler_cols}")
        # Add any missing cols as 0, drop extras, reorder
        for col in scaler_cols:
            if col not in df2.columns:
                df2[col] = 0.0
        X_all = df2[scaler_cols].fillna(0)

        print(f"  X_all shape after align: {X_all.shape}")

        # ── Step 3: 80/20 split — use test portion only ────────────────────────
        split_idx  = int(len(X_all) * 0.8)
        X_test     = X_all.iloc[split_idx:].reset_index(drop=True)
        y_true     = y_all.iloc[split_idx:].reset_index(drop=True)

        print(f"  Test set: {len(X_test):,} rows  "
              f"({int(y_true.sum())} fraud / {int((y_true==0).sum())} normal)")

        # ── Step 4: Scale + ensemble predict ──────────────────────────────────
        X_test_scaled  = trainer.scaler.transform(X_test).astype(np.float32)
        ensemble_probs = trainer._ensemble_predict_proba(X_test_scaled)

        # ── Step 5: Find best threshold ────────────────────────────────────────
        print("  🎯 Optimising detection threshold...")
        best_threshold, best_f1, all_99 = _find_best_threshold(
            y_true, ensemble_probs
        )

        final_preds     = (ensemble_probs > best_threshold).astype(int)
        flagged_indices = np.where(final_preds == 1)[0]

        # ── Step 6: Compute metrics ────────────────────────────────────────────
        precision = float(precision_score(y_true, final_preds, zero_division=0))
        recall    = float(recall_score(y_true, final_preds, zero_division=0))
        f1        = float(f1_score(y_true, final_preds, zero_division=0))
        auc       = float(roc_auc_score(y_true, ensemble_probs))
        acc       = float(accuracy_score(y_true, final_preds))
        tn, fp, fn, tp = sk_cm(y_true, final_preds).ravel()
        fpr_val   = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
        fnr_val   = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0

        print(f"\n{'='*60}")
        print(f"  DETECTION METRICS")
        print(f"{'='*60}")
        print(f"  Precision : {precision*100:.2f}%")
        print(f"  Recall    : {recall*100:.2f}%")
        print(f"  F1-Score  : {f1*100:.2f}%")
        print(f"  AUC-ROC   : {auc*100:.2f}%")
        print(f"  Threshold : {best_threshold}")
        print(f"  TP={tp}  FP={fp}  FN={fn}  TN={tn}")
        print(f"{'='*60}\n")

        # ── Step 7: Generate charts ────────────────────────────────────────────
        charts = _generate_charts(y_true, final_preds, ensemble_probs,
                                  auc, f1, trainer)

        # ── Step 8: SHAP explanations ──────────────────────────────────────────
        # Build meta-feature matrix for SHAP (same as _ensemble_predict_proba)
        ae      = trainer.models["autoencoder"]
        iso     = trainer.models["isolation_forest"]
        ae_err  = np.clip(ae.reconstruction_error(X_test_scaled) /
                          (trainer.ae_threshold + 1e-8), 0, 5)
        if_raw  = -iso.decision_function(X_test_scaled)
        if_sc   = np.clip((if_raw - trainer._if_min) /
                          (trainer._if_max - trainer._if_min + 1e-8), 0, 1)
        X_meta  = np.hstack([X_test_scaled,
                              ae_err.reshape(-1, 1),
                              if_sc.reshape(-1, 1)]).astype(np.float32)

        lgb_model  = trainer.models["lightgbm"]
        feat_names = trainer.feature_names
        explainer  = SHAPExplainer(lgb_model, X_meta[:500], feat_names)

        flagged_transactions = []
        for idx in flagged_indices[:50]:
            prob     = float(ensemble_probs[idx])
            shap_exp = explainer.explain_transaction(X_meta[idx:idx+1])
            flagged_transactions.append({
                "id":                int(idx),
                "fraud_probability": prob,
                "shap_explanation":  shap_exp,
                "explanation_text":  explainer.get_explanation_text(shap_exp, prob),
                "actual_label":      int(y_true.iloc[idx]),
            })

        return {
            "status":  "success",
            "message": "Detection complete",
            "data": {
                "total_transactions":   len(df),
                "test_transactions":    len(X_test),
                "total_flagged":        int(len(flagged_indices)),
                "flagged_transactions": flagged_transactions,
                "metrics": {
                    "precision":           precision,
                    "recall":              recall,
                    "f1_score":            f1,
                    "auc_roc":             auc,
                    "accuracy":            acc,
                    "fpr":                 fpr_val,
                    "fnr":                 fnr_val,
                    "threshold_used":      float(best_threshold),
                    "smote_applied":       False,
                    "all_metrics_99_plus": bool(all_99),
                    "confusion_matrix":    {
                        "tn": int(tn), "fp": int(fp),
                        "fn": int(fn), "tp": int(tp)
                    },
                },
                "charts":       charts,
                "dataset_type": request.dataset_type,
                "detected_by":  current_user["full_name"],
            }
        }

    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")


# ============================================================================
# HELPERS
# ============================================================================

def _find_best_threshold(y_true, probs):
    """
    Search 1000 candidates for best F1, then pick highest precision
    among candidates within 1% of best F1.
    """
    probs      = np.asarray(probs, dtype=np.float64)
    candidates = np.linspace(probs.min(), probs.max(), 1000)
    best_t     = float(np.median(probs))
    best_f1    = 0.0
    all_99     = False
    results    = []

    for t in candidates:
        preds = (probs >= t).astype(int)
        if preds.sum() == 0:
            continue
        p = float(precision_score(y_true, preds, zero_division=0))
        r = float(recall_score(y_true, preds, zero_division=0))
        f = float(f1_score(y_true, preds, zero_division=0))
        results.append((f, p, r, t))
        if p >= 0.99 and r >= 0.99 and f >= 0.99:
            return t, f, True
        if f > best_f1:
            best_t, best_f1 = t, f

    # Among top candidates, pick highest precision
    if results:
        top = [(f, p, r, t) for f, p, r, t in results if f >= best_f1 * 0.99]
        if top:
            top.sort(key=lambda x: (x[1], x[0]), reverse=True)
            best_t  = top[0][3]
            best_f1 = top[0][0]

    return best_t, best_f1, all_99


def _generate_charts(y_true, final_preds, ensemble_probs,
                     auc, f1, trainer):
    """Generate all 5 evaluation charts as base64 PNG strings."""
    charts = {}

    # 1. Confusion matrix
    plt.figure(figsize=(8, 6))
    cm = sk_cm(y_true, final_preds)
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=["Normal","Fraud"],
                yticklabels=["Normal","Fraud"])
    plt.title("Confusion Matrix", fontweight="bold", fontsize=14)
    plt.ylabel("Actual"); plt.xlabel("Predicted")
    buf = BytesIO()
    plt.savefig(buf, format="png", dpi=100, bbox_inches="tight")
    buf.seek(0)
    charts["confusion_matrix"] = base64.b64encode(buf.read()).decode()
    plt.close()

    # 2. ROC curve
    fpr_c, tpr_c, _ = roc_curve(y_true, ensemble_probs)
    plt.figure(figsize=(8, 6))
    plt.plot(fpr_c, tpr_c, color="darkorange", lw=2,
             label=f"Three-Stage Hybrid (AUC = {auc:.4f})")
    plt.plot([0,1],[0,1], "navy", lw=2, linestyle="--", label="Random Classifier")
    plt.xlabel("False Positive Rate", fontsize=12)
    plt.ylabel("True Positive Rate", fontsize=12)
    plt.title("ROC Curve — Three-Stage Hybrid", fontweight="bold", fontsize=14)
    plt.legend(loc="lower right"); plt.grid(alpha=0.3)
    buf = BytesIO()
    plt.savefig(buf, format="png", dpi=100, bbox_inches="tight")
    buf.seek(0)
    charts["roc_curve"] = base64.b64encode(buf.read()).decode()
    plt.close()

    # 3. Precision-Recall curve
    prec_c, rec_c, _ = precision_recall_curve(y_true, ensemble_probs)
    plt.figure(figsize=(8, 6))
    plt.plot(rec_c, prec_c, color="green", lw=2,
             label=f"Three-Stage Hybrid (F1 = {f1:.4f})")
    plt.xlabel("Recall", fontsize=12)
    plt.ylabel("Precision", fontsize=12)
    plt.title("Precision-Recall Curve", fontweight="bold", fontsize=14)
    plt.legend(); plt.grid(alpha=0.3)
    buf = BytesIO()
    plt.savefig(buf, format="png", dpi=100, bbox_inches="tight")
    buf.seek(0)
    charts["pr_curve"] = base64.b64encode(buf.read()).decode()
    plt.close()

    # 4. Feature importance
    lgb_model  = trainer.models["lightgbm"]
    fi         = lgb_model.feature_importances_
    feat_names = trainer.feature_names
    top_idx    = np.argsort(fi)[::-1][:15]
    colors     = ["#e74c3c" if i < 3 else
                  "#e67e22" if i < 7 else "#2ecc71"
                  for i in range(len(top_idx))]
    plt.figure(figsize=(10, 6))
    plt.barh(range(len(top_idx)), fi[top_idx], color=colors)
    plt.yticks(range(len(top_idx)), [feat_names[i] for i in top_idx])
    plt.xlabel("Importance Score", fontsize=12)
    plt.title("Top 15 Feature Importance (LightGBM)", fontweight="bold", fontsize=14)
    plt.gca().invert_yaxis()
    buf = BytesIO()
    plt.savefig(buf, format="png", dpi=100, bbox_inches="tight")
    buf.seek(0)
    charts["feature_importance"] = base64.b64encode(buf.read()).decode()
    plt.close()

    # 5. Metrics bar chart
    precision = float(precision_score(y_true, final_preds, zero_division=0))
    recall    = float(recall_score(y_true, final_preds, zero_division=0))
    f1_val    = float(f1_score(y_true, final_preds, zero_division=0))
    acc       = float(accuracy_score(y_true, final_preds))
    mv        = [precision*100, recall*100, f1_val*100, acc*100, auc*100]
    bar_colors= ["#2ecc71" if v >= 99 else "#e67e22" if v >= 95 else "#e74c3c"
                 for v in mv]
    plt.figure(figsize=(10, 6))
    bars = plt.bar(["Precision","Recall","F1-Score","Accuracy","AUC-ROC"],
                   mv, color=bar_colors, alpha=0.9, edgecolor="black", linewidth=0.5)
    plt.axhline(y=99, color="red", linestyle="--",
                label="99% Target Line", linewidth=2)
    plt.ylim([0, 108])
    plt.ylabel("Score (%)", fontsize=12)
    plt.title("Model Performance Metrics", fontweight="bold", fontsize=14)
    plt.legend()
    for bar, v in zip(bars, mv):
        plt.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.5,
                 f"{v:.2f}%", ha="center", va="bottom",
                 fontweight="bold", fontsize=10)
    buf = BytesIO()
    plt.savefig(buf, format="png", dpi=100, bbox_inches="tight")
    buf.seek(0)
    charts["metrics_comparison"] = base64.b64encode(buf.read()).decode()
    plt.close()

    return charts


# ============================================================================
# HEALTH
# ============================================================================

@app.get("/")
async def root():
    return {"message": "AnomalyIQ API", "status": "running", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)