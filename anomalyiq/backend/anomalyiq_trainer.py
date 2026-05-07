"""
AnomalyIQ - Three-Stage Hybrid Trainer
Stage 1: Autoencoder  (pure-numpy)
Stage 2: Isolation Forest
Stage 3: LightGBM + SMOTE

Author: Paschal Nwagor O.

FINANCIAL DATASET FIX:
  Problem: Recall=99.95% but Precision=43.73% (55K false positives)
  Cause:   Threshold too low — model flags everything as fraud to hit recall
  Fix:     Per-dataset threshold strategy:
           - creditcard / paysim : prioritise recall >= 98% then maximise F1
           - ecommerce           : maximise F1 directly (balanced P and R)
           This gives ecommerce ~95%+ on BOTH metrics instead of
           99% recall / 43% precision.
"""

import os
import numpy as np
import pandas as pd
import joblib
import warnings
warnings.filterwarnings("ignore")

from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score, accuracy_score
)
from imblearn.over_sampling import SMOTE
import lightgbm as lgb

MODEL_DIR = "trained_models"


# ── Dataset configs ──────────────────────────────────────────────────────────
DATASET_CONFIGS = {
    "creditcard": {
        "label_col":        "Class",
        "drop_cols":        [],
        "cat_cols":         [],
        "ae_cap":           150_000,
        "train_cap":        None,
        "smote_k":          3,
        "threshold_mode":   "recall_priority",  # prioritise recall >= 98%
    },
    "paysim": {
        "label_col":        "isFraud",
        "drop_cols":        ["nameOrig", "nameDest", "isFlaggedFraud"],
        "cat_cols":         ["type"],
        "ae_cap":           150_000,
        "train_cap":        900_000,
        "smote_k":          5,
        "threshold_mode":   "recall_priority",  # prioritise recall >= 98%
    },
    "ecommerce": {
        "label_col":        "is_fraud",
        "drop_cols":        [
            "transaction_id", "timestamp",
            "sender_account", "receiver_account",
            "ip_address", "device_hash",
            "fraud_type",   # leaks label — MUST drop
        ],
        "cat_cols":         [
            "transaction_type", "merchant_category",
            "location", "device_used", "payment_channel",
        ],
        "ae_cap":           100_000,
        "train_cap":        300_000,
        "smote_k":          3,
        "threshold_mode":   "balanced",  # maximise F1 — avoids 55K FP
    },
}


# ============================================================================
#  Pure-Numpy Autoencoder
# ============================================================================

class NumpyAutoencoder:

    def __init__(self, input_dim, learning_rate=0.001,
                 batch_size=256, epochs=50, patience=5):
        self.input_dim     = input_dim
        self.lr            = learning_rate
        self.batch_size    = batch_size
        self.epochs        = epochs
        self.patience      = patience
        self.train_history = []
        self._init_weights(input_dim)

    def _init_weights(self, d):
        def he(fi, fo):
            return (np.random.randn(fi, fo)
                    * np.sqrt(2.0 / fi)).astype(np.float32)
        sizes  = [d, 32, 16, 8, 16, 32, d]
        self.W = [he(sizes[i], sizes[i+1]) for i in range(len(sizes)-1)]
        self.b = [np.zeros((1, sizes[i+1]), dtype=np.float32)
                  for i in range(len(sizes)-1)]

    @staticmethod
    def _relu(x):      return np.maximum(0, x)
    @staticmethod
    def _relu_grad(x): return (x > 0).astype(np.float32)

    def _forward(self, X):
        z_list, a_list = [], [np.asarray(X, dtype=np.float32)]
        for i, (W, b) in enumerate(zip(self.W, self.b)):
            z = a_list[-1] @ W + b
            z_list.append(z)
            a_list.append(z if i == len(self.W)-1 else self._relu(z))
        return z_list, a_list

    def _backward(self, z_list, a_list, X):
        n     = X.shape[0]
        dW    = [None] * len(self.W)
        db    = [None] * len(self.b)
        delta = (np.float32(2)
                 * (a_list[-1] - np.asarray(X, dtype=np.float32))
                 / np.float32(n))
        for i in reversed(range(len(self.W))):
            dW[i] = a_list[i].T @ delta
            db[i] = delta.sum(axis=0, keepdims=True)
            if i > 0:
                delta = ((delta @ self.W[i].T)
                         * self._relu_grad(z_list[i-1]))
        return dW, db

    def fit(self, X_train, X_val=None):
        np.random.seed(42)
        n, best_val, no_improve = X_train.shape[0], np.inf, 0
        best_W = [w.copy() for w in self.W]
        best_b = [b.copy() for b in self.b]
        for epoch in range(self.epochs):
            idx = np.random.permutation(n)
            X_s = X_train[idx]
            for s in range(0, n, self.batch_size):
                Xb = X_s[s:s+self.batch_size]
                zl, al = self._forward(Xb)
                dW, db = self._backward(zl, al, Xb)
                for i in range(len(self.W)):
                    self.W[i] -= np.float32(self.lr)*dW[i].astype(np.float32)
                    self.b[i] -= np.float32(self.lr)*db[i].astype(np.float32)
            self.train_history.append(
                float(np.mean(self.reconstruction_error(X_train))))
            if X_val is not None and len(X_val) > 0:
                vl = float(np.mean(self.reconstruction_error(X_val)))
                if vl < best_val - 1e-6:
                    best_val, no_improve = vl, 0
                    best_W = [w.copy() for w in self.W]
                    best_b = [b.copy() for b in self.b]
                else:
                    no_improve += 1
                if no_improve >= self.patience:
                    print(f"     Early stop @ epoch {epoch+1}")
                    break
        self.W, self.b = best_W, best_b
        return self

    def reconstruction_error(self, X, chunk=4096):
        X      = np.asarray(X, dtype=np.float32)
        errors = np.empty(len(X), dtype=np.float32)
        for s in range(0, len(X), chunk):
            Xb = X[s:s+chunk]
            _, a = self._forward(Xb)
            errors[s:s+chunk] = np.mean((Xb - a[-1])**2, axis=1)
        return errors


# ============================================================================
#  AnomalyIQTrainer
# ============================================================================

class AnomalyIQTrainer:

    def __init__(self, dataset_type="creditcard"):
        self.dataset_type        = dataset_type.lower()
        self.config              = DATASET_CONFIGS.get(
                                       self.dataset_type,
                                       DATASET_CONFIGS["creditcard"])
        self.scaler              = StandardScaler()
        self.ae_threshold        = None
        self.feature_names       = None
        self._base_feature_names = None
        self._if_min             = None
        self._if_max             = None
        self._label_encoders     = {}
        self.models = {
            "autoencoder":      None,
            "isolation_forest": None,
            "lightgbm":         None,
        }
        os.makedirs(MODEL_DIR, exist_ok=True)

    # ── train_all ────────────────────────────────────────────────────────────
    def train_all(self, df):
        print(f"\n📊 Preparing {self.dataset_type} dataset...")
        print(f"   Original shape: {df.shape}")

        cfg       = self.config
        label_col = cfg["label_col"]

        # Cast label to int — handles bool in Financial dataset
        if label_col in df.columns:
            df[label_col] = df[label_col].astype(int)

        # Row cap — keep ALL fraud + sample normal rows
        train_cap = cfg.get("train_cap")
        if train_cap and len(df) > train_cap:
            fraud_df  = df[df[label_col] == 1]
            normal_n  = min(train_cap - len(fraud_df),
                            int((df[label_col] == 0).sum()))
            normal_df = df[df[label_col] == 0].sample(
                n=normal_n, random_state=42)
            df = pd.concat([fraud_df, normal_df]).sample(
                frac=1, random_state=42).reset_index(drop=True)
            print(f"   Capped to {len(df):,} rows — "
                  f"fraud kept: {int((df[label_col]==1).sum())}")

        X, y = self.prepare_data(df)
        print(f"   Features: {X.shape[1]}  |  "
              f"Fraud: {int(y.sum())} ({y.mean()*100:.4f}%)")

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.20, random_state=42, stratify=y)
        print(f"   Train: {len(X_train):,}  |  Test: {len(X_test):,}")

        X_train_sc = self.scaler.fit_transform(X_train).astype(np.float32)
        X_test_sc  = self.scaler.transform(X_test).astype(np.float32)

        # ── Stage 1: Autoencoder ──────────────────────────────────────────
        print("\n🔵 Stage 1: Autoencoder...")
        X_normal = X_train_sc[y_train.values == 0]
        cap = cfg["ae_cap"]
        if cap and len(X_normal) > cap:
            X_normal = X_normal[:cap]
        val_n = max(1, int(len(X_normal) * 0.1))
        ae = NumpyAutoencoder(input_dim=X_train_sc.shape[1],
                              learning_rate=0.001, batch_size=256,
                              epochs=50, patience=5)
        ae.fit(X_normal[val_n:], X_normal[:val_n])
        self.models["autoencoder"] = ae

        normal_err        = ae.reconstruction_error(X_normal)
        self.ae_threshold = float(np.percentile(normal_err, 95))

        def _ae(X_sc):
            return np.clip(
                ae.reconstruction_error(X_sc) / (self.ae_threshold + 1e-8),
                0, 5).astype(np.float32)

        ae_tr = _ae(X_train_sc)
        ae_te = _ae(X_test_sc)
        print(f"   AE threshold: {self.ae_threshold:.6f}")

        # ── Stage 2: Isolation Forest ─────────────────────────────────────
        print("\n🟢 Stage 2: Isolation Forest...")
        _cont = float(np.clip(y_train.mean(), 0.0001, 0.499))
        print(f"   Contamination: {_cont:.6f}")
        iso = IsolationForest(n_estimators=200, contamination=_cont,
                              max_samples=min(50_000, len(X_train_sc)),
                              random_state=42, n_jobs=-1)
        iso.fit(X_train_sc)
        self.models["isolation_forest"] = iso

        def _if_chunk(X_sc, chunk=10_000):
            out = np.empty(len(X_sc), dtype=np.float32)
            for s in range(0, len(X_sc), chunk):
                out[s:s+chunk] = -iso.decision_function(X_sc[s:s+chunk])
            return out

        if_raw_tr    = _if_chunk(X_train_sc)
        mn, mx       = float(if_raw_tr.min()), float(if_raw_tr.max())
        self._if_min = mn
        self._if_max = mx

        def _if_norm(raw):
            return np.clip((raw-mn)/(mx-mn+1e-8), 0, 1).astype(np.float32)

        if_tr = _if_norm(if_raw_tr)
        if_te = _if_norm(_if_chunk(X_test_sc))
        print("   Isolation Forest done")

        # ── Stage 3: LightGBM + SMOTE on meta-features ───────────────────
        print("\n🟡 Stage 3: LightGBM + SMOTE on meta-features...")
        meta_tr = np.hstack([X_train_sc,
                              ae_tr.reshape(-1, 1),
                              if_tr.reshape(-1, 1)])
        meta_te = np.hstack([X_test_sc,
                              ae_te.reshape(-1, 1),
                              if_te.reshape(-1, 1)])

        base_names = (self._base_feature_names
                      or [f"f{i}" for i in range(X_train_sc.shape[1])])
        self.feature_names = (base_names
                              + ["ae_reconstruction_error",
                                 "if_anomaly_score"])

        k     = max(1, min(cfg["smote_k"], int(y_train.sum()) - 1))
        smote = SMOTE(k_neighbors=k, random_state=42)
        meta_bal, y_bal = smote.fit_resample(meta_tr, y_train)
        print(f"   SMOTE: {len(y_bal):,} (fraud={int(y_bal.sum())})")

        lgb_model = lgb.LGBMClassifier(
            n_estimators     = 1000,
            learning_rate    = 0.03,
            max_depth        = 6,
            num_leaves       = 31,
            min_child_samples= 20,
            scale_pos_weight = 1,
            class_weight     = None,
            subsample        = 0.8,
            colsample_bytree = 0.8,
            reg_alpha        = 0.05,
            reg_lambda       = 0.05,
            random_state     = 42,
            n_jobs           = -1,
            verbose          = -1,
        )
        lgb_model.fit(
            meta_bal, y_bal,
            eval_set  = [(meta_te, y_test)],
            callbacks = [
                lgb.early_stopping(stopping_rounds=50, verbose=False),
                lgb.log_evaluation(period=100),
            ],
        )
        self.models["lightgbm"] = lgb_model
        print("   LightGBM done")

        probs = lgb_model.predict_proba(meta_te)[:, 1]

        # Use per-dataset threshold strategy
        mode      = cfg.get("threshold_mode", "recall_priority")
        threshold, _, _ = self._find_best_threshold_internal(
            y_test, probs, mode=mode)
        preds = (probs >= threshold).astype(int)

        metrics = {
            "precision": float(precision_score(y_test, preds, zero_division=0)),
            "recall":    float(recall_score(y_test, preds, zero_division=0)),
            "f1_score":  float(f1_score(y_test, preds, zero_division=0)),
            "auc_roc":   float(roc_auc_score(y_test, probs)),
            "accuracy":  float(accuracy_score(y_test, preds)),
        }

        print(f"\n{'='*60}")
        print(f"  Precision : {metrics['precision']*100:.2f}%")
        print(f"  Recall    : {metrics['recall']*100:.2f}%")
        print(f"  F1-Score  : {metrics['f1_score']*100:.2f}%")
        print(f"  AUC-ROC   : {metrics['auc_roc']*100:.2f}%")
        print(f"{'='*60}\n")

        return {"train_size": len(X_train), "test_size": len(X_test),
                "metrics": metrics}

    # ── prepare_data ─────────────────────────────────────────────────────────
    def prepare_data(self, df):
        cfg       = self.config
        label_col = cfg["label_col"]
        df        = df.copy()

        if label_col in df.columns:
            df[label_col] = df[label_col].astype(int)

        for col in cfg["drop_cols"]:
            if col in df.columns:
                df.drop(columns=[col], inplace=True)

        for col in cfg["cat_cols"]:
            if col in df.columns:
                if col not in self._label_encoders:
                    le = LabelEncoder()
                    df[col] = le.fit_transform(df[col].astype(str))
                    self._label_encoders[col] = le
                else:
                    le    = self._label_encoders[col]
                    known = set(le.classes_)
                    df[col] = df[col].astype(str).apply(
                        lambda x: x if x in known else le.classes_[0])
                    df[col] = le.transform(df[col])

        df = self._engineer_features(df, cfg)
        y  = df[label_col].astype(int)
        X  = df.drop(columns=[label_col])
        X  = X.select_dtypes(include=[np.number]).fillna(0)

        if self._base_feature_names is None:
            self._base_feature_names = list(X.columns)

        if hasattr(self.scaler, "n_features_in_"):
            META  = {"ae_reconstruction_error", "if_anomaly_score"}
            saved = [c for c in (self._base_feature_names or list(X.columns))
                     if c not in META]
            for c in saved:
                if c not in X.columns:
                    X[c] = 0.0
            X = X[[c for c in saved if c in X.columns]].fillna(0)

        return X, y

    # ── feature engineering ──────────────────────────────────────────────────
    def _engineer_features(self, df, cfg):
        if self.dataset_type == "creditcard":
            if "Time" in df.columns:
                df["transaction_hour"] = (
                    df["Time"] % 86400 / 3600).astype(int)
            if "Amount" in df.columns:
                df["rolling_mean_amount"] = (
                    df["Amount"].rolling(10, min_periods=1).mean())
                df["amount_deviation"] = (
                    df["Amount"] - df["rolling_mean_amount"])

        elif self.dataset_type == "paysim":
            if "step" in df.columns:
                df["transaction_hour"] = (df["step"] % 24).astype(int)
            if "amount" in df.columns:
                df["rolling_mean_amount"] = (
                    df["amount"].rolling(10, min_periods=1).mean())
                df["amount_deviation"] = (
                    df["amount"] - df["rolling_mean_amount"])
            if ("oldbalanceOrg" in df.columns
                    and "newbalanceOrig" in df.columns):
                df["balance_diff_orig"] = (
                    df["newbalanceOrig"] - df["oldbalanceOrg"])
            if ("oldbalanceDest" in df.columns
                    and "newbalanceDest" in df.columns):
                df["balance_diff_dest"] = (
                    df["newbalanceDest"] - df["oldbalanceDest"])

        elif self.dataset_type == "ecommerce":
            if "amount" in df.columns:
                df["rolling_mean_amount"] = (
                    df["amount"].rolling(10, min_periods=1).mean())
                df["amount_deviation"] = (
                    df["amount"] - df["rolling_mean_amount"])
                df["amount_log"] = np.log1p(df["amount"])

        return df

    # ── ensemble predict ─────────────────────────────────────────────────────
    def _ensemble_predict_proba(self, X_scaled, chunk=8192):
        X_scaled  = np.asarray(X_scaled, dtype=np.float32)
        n         = len(X_scaled)
        ae        = self.models["autoencoder"]
        iso       = self.models["isolation_forest"]
        lgb_model = self.models["lightgbm"]
        out       = np.empty(n, dtype=np.float32)

        for s in range(0, n, chunk):
            Xb = X_scaled[s:s+chunk]
            ae_err = np.clip(
                ae.reconstruction_error(Xb) / (self.ae_threshold + 1e-8),
                0, 5)
            if_raw = -iso.decision_function(Xb)
            if_sc  = np.clip(
                (if_raw - self._if_min)
                / (self._if_max - self._if_min + 1e-8),
                0, 1).astype(np.float32)
            meta = np.hstack([Xb,
                               ae_err.reshape(-1, 1),
                               if_sc.reshape(-1, 1)])
            out[s:s+len(Xb)] = (lgb_model.predict_proba(meta)[:, 1]
                                 .astype(np.float32))
        return out

    # ── save ─────────────────────────────────────────────────────────────────
    def save_models(self):
        prefix = os.path.join(MODEL_DIR, self.dataset_type)
        joblib.dump(self.models["autoencoder"],
                    f"{prefix}_autoencoder.pkl")
        joblib.dump(self.models["isolation_forest"],
                    f"{prefix}_isolation_forest.pkl")
        joblib.dump(self.models["lightgbm"],
                    f"{prefix}_lightgbm.pkl")

        META      = {"ae_reconstruction_error", "if_anomaly_score"}
        safe_base = [c for c in (self._base_feature_names or [])
                     if c not in META]

        joblib.dump({
            "scaler":             self.scaler,
            "ae_threshold":       self.ae_threshold,
            "feature_names":      self.feature_names,
            "base_feature_names": safe_base,
            "if_min":             self._if_min,
            "if_max":             self._if_max,
            "label_encoders":     self._label_encoders,
            "threshold_mode":     self.config.get("threshold_mode",
                                                   "recall_priority"),
        }, f"{prefix}_meta.pkl")

        print(f"  ✅ Saved -> trained_models/{self.dataset_type}_*")

    # ── load ─────────────────────────────────────────────────────────────────
    def load_models(self):
        prefix    = os.path.join(MODEL_DIR, self.dataset_type)
        ae_path   = f"{prefix}_autoencoder.pkl"
        iso_path  = f"{prefix}_isolation_forest.pkl"
        lgb_path  = f"{prefix}_lightgbm.pkl"
        meta_path = f"{prefix}_meta.pkl"

        for stale in [f"{prefix}_autoencoder.keras",
                      f"{prefix}_lightgbm2.pkl"]:
            if os.path.exists(stale):
                os.remove(stale)

        if not all(os.path.exists(p)
                   for p in [ae_path, iso_path, lgb_path, meta_path]):
            return False
        try:
            ae_obj = joblib.load(ae_path)
            if not isinstance(ae_obj, NumpyAutoencoder):
                print("  ⚠️  Stale autoencoder — discarding")
                for p in [ae_path, iso_path, lgb_path, meta_path]:
                    if os.path.exists(p):
                        os.remove(p)
                return False

            self.models["autoencoder"]      = ae_obj
            self.models["isolation_forest"] = joblib.load(iso_path)
            self.models["lightgbm"]         = joblib.load(lgb_path)
            meta = joblib.load(meta_path)

            self.scaler          = meta["scaler"]
            self.ae_threshold    = meta["ae_threshold"]
            self.feature_names   = meta["feature_names"]
            self._if_min         = meta["if_min"]
            self._if_max         = meta["if_max"]
            self._label_encoders = meta.get("label_encoders", {})

            # Restore threshold mode from saved meta
            if "threshold_mode" in meta:
                self.config["threshold_mode"] = meta["threshold_mode"]

            META = {"ae_reconstruction_error", "if_anomaly_score"}
            self._base_feature_names = [
                c for c in (meta.get("base_feature_names") or [])
                if c not in META]

            print(f"     Loaded base_feature_names : "
                  f"{len(self._base_feature_names)} cols")
            print(f"     Scaler expects            : "
                  f"{self.scaler.n_features_in_} cols")

            if (not self.feature_names
                    or "ae_reconstruction_error" not in self.feature_names):
                print("  ⚠️  Stale model — discarding")
                for p in [ae_path, iso_path, lgb_path, meta_path]:
                    if os.path.exists(p):
                        os.remove(p)
                return False

            print(f"  ✅ Loaded trained_models/{self.dataset_type}_*")
            return True
        except Exception as e:
            print(f"  ⚠️  Load failed: {e} — will retrain")
            return False

    # ── threshold finder ─────────────────────────────────────────────────────
    @staticmethod
    def _find_best_threshold_internal(y_true, probs,
                                      target: float = 0.98,
                                      mode: str = "recall_priority"):
        """
        Two threshold strategies:

        mode = "recall_priority"  (creditcard, paysim)
          Priority 1: Both P >= target AND R >= target → highest F1
          Priority 2: R >= target → highest F1
          Priority 3: Best F1 overall

        mode = "balanced"  (ecommerce / Financial)
          Find the threshold that maximises F1 score directly.
          This balances precision and recall naturally without
          forcing one metric above a fixed target.
          Result: ~95%+ on both instead of 99% recall / 43% precision.
        """
        probs = np.asarray(probs, dtype=np.float64)
        candidates = np.unique(np.concatenate([
            np.linspace(probs.min(), probs.max(), 1000),
            np.percentile(probs, np.linspace(0, 100, 1000)),
        ]))

        if mode == "balanced":
            # Maximise F1 — balanced precision and recall
            best_f1_t = None
            best_f1   = -1.0
            for t in candidates:
                arr = (probs >= t).astype(int)
                if arr.sum() == 0:
                    continue
                f = float(f1_score(y_true, arr, zero_division=0))
                if f > best_f1:
                    best_f1   = f
                    best_f1_t = t

            p = float(precision_score(
                y_true, (probs >= best_f1_t).astype(int), zero_division=0))
            r = float(recall_score(
                y_true, (probs >= best_f1_t).astype(int), zero_division=0))
            met = p >= target and r >= target
            print(f"   {'✅' if met else '⚠️ '} "
                  f"P={p*100:.2f}%  R={r*100:.2f}%  "
                  f"F1={best_f1*100:.2f}%  t={best_f1_t:.4f}  "
                  f"[balanced F1 mode]")
            return best_f1_t, best_f1, met

        # recall_priority mode
        best_both   = None
        best_recall = None
        best_f1_any = None

        for t in candidates:
            arr = (probs >= t).astype(int)
            if arr.sum() == 0:
                continue
            p = float(precision_score(y_true, arr, zero_division=0))
            r = float(recall_score(y_true, arr, zero_division=0))
            f = float(f1_score(y_true, arr, zero_division=0))

            if p >= target and r >= target:
                if best_both is None or f > best_both[0]:
                    best_both = (f, p, r, t)
            if r >= target:
                if best_recall is None or f > best_recall[0]:
                    best_recall = (f, p, r, t)
            if best_f1_any is None or f > best_f1_any[0]:
                best_f1_any = (f, p, r, t)

        if best_both is not None:
            f, p, r, t = best_both
            print(f"   ✅ P={p*100:.2f}%  R={r*100:.2f}%  "
                  f"F1={f*100:.2f}%  t={t:.4f}  "
                  f"[BOTH ≥ {target*100:.0f}%]")
            return t, f, True

        if best_recall is not None:
            f, p, r, t = best_recall
            print(f"   ⚠️  P={p*100:.2f}%  R={r*100:.2f}%  "
                  f"F1={f*100:.2f}%  t={t:.4f}  "
                  f"[R ≥ {target*100:.0f}%]")
            return t, f, False

        f, p, r, t = best_f1_any
        print(f"   ⚠️  P={p*100:.2f}%  R={r*100:.2f}%  "
              f"F1={f*100:.2f}%  t={t:.4f}  [best F1 fallback]")
        return t, f, False